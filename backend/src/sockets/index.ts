import { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { GameType } from '@prisma/client';

interface Question {
  id: string;
  question: string;
  answer: string;
  options: string[];
  gameType: GameType;
  timeLimit: number;
}

interface RoomState {
  players: Record<string, string>;
  gameType: GameType;
  questions: Question[];
  currentQuestion: number;
  state: 'lobby' | 'playing' | 'question_ended' | 'finished';
  leaderboard: Record<string, number>;
  answeredPlayers: Set<string>;
  questionTimer: ReturnType<typeof setTimeout> | null;
  roomDbId: string | null;
}

function scrambleWord(word: string): string {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join('');
  return result === word && word.length > 2 ? scrambleWord(word) : result;
}

export const setupSockets = (io: Server) => {
  const roomsStates: Record<string, RoomState> = {};

  const endQuestion = async (roomCode: string) => {
    const state = roomsStates[roomCode];
    if (!state || state.state !== 'playing') return;

    if (state.questionTimer) {
      clearTimeout(state.questionTimer);
      state.questionTimer = null;
    }

    state.state = 'question_ended';
    const currentQ = state.questions[state.currentQuestion];
    io.to(roomCode).emit('question_ended', { correctAnswer: currentQ.answer });

    const leaderboardArr = Object.keys(state.leaderboard)
      .filter(n => n !== 'HOST')
      .map(name => ({ name, score: state.leaderboard[name] }))
      .sort((a, b) => b.score - a.score);

    io.to(roomCode).emit('update_leaderboard', leaderboardArr);
    state.currentQuestion++;

    if (state.currentQuestion >= state.questions.length) {
      setTimeout(async () => {
        io.to(roomCode).emit('game_over', { winner: leaderboardArr[0], leaderboard: leaderboardArr });
        state.state = 'finished';
        if (state.roomDbId) {
          try {
            await prisma.gameSession.create({
              data: { roomId: state.roomDbId, scores: state.leaderboard, winner: leaderboardArr[0]?.name ?? null },
            });
            await prisma.room.update({ where: { id: state.roomDbId }, data: { status: 'FINISHED' } });
          } catch (e) {
            console.error('Failed to save session:', e);
          }
        }
      }, 5000);
    } else {
      setTimeout(() => sendQuestion(roomCode), 5000);
    }
  };

  const sendQuestion = (roomCode: string) => {
    const state = roomsStates[roomCode];
    if (!state || state.currentQuestion >= state.questions.length) return;

    state.state = 'playing';
    state.answeredPlayers = new Set();
    const q = state.questions[state.currentQuestion];

    const payload: Record<string, unknown> = {
      question: q.question,
      options: q.options,
      timeLimit: q.timeLimit,
      questionNumber: state.currentQuestion + 1,
      totalQuestions: state.questions.length,
      gameType: state.gameType,
    };

    if (state.gameType === GameType.WORD_SCRAMBLE) {
      payload.scrambledWord = scrambleWord(q.answer);
      payload.options = [];
    }

    io.to(roomCode).emit('new_question', payload);
    state.questionTimer = setTimeout(() => endQuestion(roomCode), q.timeLimit * 1000);
  };

  io.on('connection', (socket: Socket) => {
    socket.on('join_room', async ({ roomCode, userName }) => {
      try {
        const room = await prisma.room.findUnique({ where: { roomCode } });
        if (!room) {
          socket.emit('error', { message: 'Room not found. Ask the host to create a room first.' });
          return;
        }

        socket.join(roomCode);

        if (!roomsStates[roomCode]) {
          roomsStates[roomCode] = {
            players: {},
            gameType: room.gameType,
            questions: [],
            currentQuestion: 0,
            state: 'lobby',
            leaderboard: {},
            answeredPlayers: new Set(),
            questionTimer: null,
            roomDbId: room.id,
          };
        }

        roomsStates[roomCode].players[userName] = socket.id;
        if (userName !== 'HOST') {
          roomsStates[roomCode].leaderboard[userName] = 0;
        }

        io.to(roomCode).emit('user_joined', { userName, message: `${userName} joined.` });
        io.to(roomCode).emit('update_leaderboard',
          Object.keys(roomsStates[roomCode].leaderboard)
            .map(name => ({ name, score: roomsStates[roomCode].leaderboard[name] }))
        );
        socket.emit('room_info', { gameType: room.gameType });
      } catch (e) {
        console.error('join_room error:', e);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    socket.on('start_game', async ({ roomCode }) => {
      const state = roomsStates[roomCode];
      if (!state) return;

      try {
        const rawQuestions = await prisma.question.findMany({
          where: { gameType: state.gameType },
          take: 20,
        });

        const limit = state.gameType === GameType.WORD_SCRAMBLE ? 8 : 10;
        const shuffled = [...rawQuestions].sort(() => Math.random() - 0.5).slice(0, limit);
        state.questions = shuffled;
        state.state = 'playing';
        state.currentQuestion = 0;

        if (state.roomDbId) {
          await prisma.room.update({ where: { id: state.roomDbId }, data: { status: 'IN_PROGRESS' } });
        }

        io.to(roomCode).emit('game_started', { gameType: state.gameType });
        setTimeout(() => sendQuestion(roomCode), 3000);
      } catch (e) {
        console.error('start_game error:', e);
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    socket.on('submit_answer', ({ roomCode, userName, answer, timeTaken }) => {
      const state = roomsStates[roomCode];
      if (!state || state.state !== 'playing' || state.answeredPlayers.has(userName)) return;

      state.answeredPlayers.add(userName);
      const currentQ = state.questions[state.currentQuestion];
      if (!currentQ) return;

      const isCorrect = state.gameType === GameType.WORD_SCRAMBLE
        ? answer.trim().toUpperCase() === currentQ.answer.toUpperCase()
        : answer === currentQ.answer;

      let points = 0;
      if (isCorrect) {
        const multiplier = state.gameType === GameType.TRUE_OR_FALSE ? 30 : 50;
        points = Math.max(0, Math.round(1000 - timeTaken * multiplier));
        state.leaderboard[userName] = (state.leaderboard[userName] || 0) + points;
      }

      socket.emit('answer_result', { correct: isCorrect, points });

      const playerCount = Object.keys(state.players).filter(n => n !== 'HOST').length;
      if (state.answeredPlayers.size >= playerCount) {
        endQuestion(roomCode);
      }
    });

    socket.on('disconnect', () => {
      for (const roomCode of Object.keys(roomsStates)) {
        const state = roomsStates[roomCode];
        const playerName = Object.keys(state.players).find(n => state.players[n] === socket.id);
        if (playerName) {
          delete state.players[playerName];
          if (playerName !== 'HOST') {
            io.to(roomCode).emit('user_left', { userName: playerName });
          }
        }
      }
    });
  });
};
