import { Server, Socket } from 'socket.io';

const mockQuestions = [
  { id: 1, question: "What is the primary color of the Google logo that repeats twice?", options: ["Red", "Blue", "Green", "Yellow"], answer: "Blue", timeLimit: 15 },
  { id: 2, question: "Which protocol is used for real-time bi-directional communication?", options: ["HTTP", "FTP", "WebSockets", "SMTP"], answer: "WebSockets", timeLimit: 15 },
  { id: 3, question: "What is the output of typeof null in JavaScript?", options: ["'null'", "'object'", "'undefined'", "'number'"], answer: "'object'", timeLimit: 15 },
];

export const setupSockets = (io: Server) => {
  const roomsStates: Record<string, any> = {};

  io.on('connection', (socket: Socket) => {
    socket.on('join_room', ({ roomCode, userName }) => {
      socket.join(roomCode);
      
      if (!roomsStates[roomCode]) {
        roomsStates[roomCode] = { players: {}, currentQuestion: 0, state: 'lobby', leaderboard: {} };
      }
      
      roomsStates[roomCode].players[userName] = socket.id;
      roomsStates[roomCode].leaderboard[userName] = 0;

      io.to(roomCode).emit('user_joined', { userName, message: `${userName} joined.` });
      // Send current leaderboard state
      io.to(roomCode).emit('update_leaderboard', Object.keys(roomsStates[roomCode].leaderboard).map(name => ({ name, score: roomsStates[roomCode].leaderboard[name] })));
    });

    socket.on('start_game', ({ roomCode }) => {
      if (roomsStates[roomCode]) {
        roomsStates[roomCode].state = 'playing';
        roomsStates[roomCode].currentQuestion = 0;
        io.to(roomCode).emit('game_started');
        
        // Start first question after a brief delay
        setTimeout(() => {
          sendQuestion(roomCode);
        }, 3000);
      }
    });

    const sendQuestion = (roomCode: string) => {
      const state = roomsStates[roomCode];
      if (state.currentQuestion < mockQuestions.length) {
        const q = mockQuestions[state.currentQuestion];
        io.to(roomCode).emit('new_question', { question: q.question, options: q.options, timeLimit: q.timeLimit });
        
        // Logic to transition to leaderboard after question ends could be more robust,
        // but for POC we let the host manually progress or use a fixed timeout.
        setTimeout(() => {
          io.to(roomCode).emit('question_ended');
          const leaderboardArr = Object.keys(state.leaderboard).map(name => ({ name, score: state.leaderboard[name] })).sort((a,b) => b.score - a.score);
          io.to(roomCode).emit('update_leaderboard', leaderboardArr);
          state.currentQuestion++;
          
          if(state.currentQuestion >= mockQuestions.length) {
             setTimeout(() => io.to(roomCode).emit('game_over', { winner: leaderboardArr[0] }), 5000);
          } else {
             setTimeout(() => sendQuestion(roomCode), 5000);
          }
        }, q.timeLimit * 1000);
      }
    };

    socket.on('submit_answer', ({ roomCode, userName, answer, timeTaken }) => {
      const state = roomsStates[roomCode];
      if(state) {
        const currentQ = mockQuestions[state.currentQuestion];
        if (currentQ && answer === currentQ.answer) {
           const points = Math.max(0, 1000 - timeTaken * 50); // Simple point drop
           state.leaderboard[userName] += points;
        }
      }
    });
  });
};
