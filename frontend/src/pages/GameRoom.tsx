import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { Play, Users, Trophy, Clock, CheckCircle2, XCircle, Send } from 'lucide-react';

interface LeaderboardEntry {
  name: string;
  score: number;
}

interface AnswerResult {
  correct: boolean;
  points: number;
}

const GAME_LABELS: Record<string, string> = {
  TRIVIA: 'Trivia Quiz',
  WORD_SCRAMBLE: 'Word Scramble',
  TRUE_OR_FALSE: 'True or False',
};

const RANK_COLORS = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];

export default function GameRoom() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const playerName = searchParams.get('name') || 'Guest';
  const isHost = searchParams.get('host') === 'true';
  const { socket } = useSocket();

  const [players, setPlayers] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'question_ended' | 'finished'>('lobby');
  const [gameType, setGameType] = useState<string>('TRIVIA');

  // Question state
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [scrambledWord, setScrambledWord] = useState('');
  const [timeLimit, setTimeLimit] = useState(15);
  const [timeLeft, setTimeLeft] = useState(15);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(10);

  // Answer state
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [wordInput, setWordInput] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);

  // Scores
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [winner, setWinner] = useState<LeaderboardEntry | null>(null);
  const [roomError, setRoomError] = useState('');

  useEffect(() => {
    if (!socket || !roomId) return;

    const userName = isHost ? 'HOST' : playerName;
    socket.emit('join_room', { roomCode: roomId, userName });

    socket.on('room_info', ({ gameType: gt }: { gameType: string }) => setGameType(gt));
    socket.on('error', ({ message }: { message: string }) => setRoomError(message));

    socket.on('user_joined', ({ userName: u }: { userName: string }) => {
      if (u !== 'HOST') setPlayers(prev => [...new Set([...prev, u])]);
    });
    socket.on('user_left', ({ userName: u }: { userName: string }) => {
      setPlayers(prev => prev.filter(p => p !== u));
    });

    socket.on('game_started', ({ gameType: gt }: { gameType: string }) => {
      setGameType(gt);
      setGameState('playing');
    });

    socket.on('new_question', (data: {
      question: string; options: string[]; scrambledWord?: string;
      timeLimit: number; questionNumber: number; totalQuestions: number; gameType: string;
    }) => {
      setQuestion(data.question);
      setOptions(data.options);
      setScrambledWord(data.scrambledWord ?? '');
      setTimeLimit(data.timeLimit);
      setTimeLeft(data.timeLimit);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
      setSelectedAnswer(null);
      setWordInput('');
      setCorrectAnswer(null);
      setAnswerResult(null);
      setGameType(data.gameType);
      setGameState('playing');
      if (data.gameType === 'WORD_SCRAMBLE') {
        setTimeout(() => wordInputRef.current?.focus(), 100);
      }
    });

    socket.on('question_ended', ({ correctAnswer: ca }: { correctAnswer: string }) => {
      setCorrectAnswer(ca);
      setGameState('question_ended');
    });

    socket.on('update_leaderboard', (data: LeaderboardEntry[]) => {
      setLeaderboard(data.filter(p => p.name !== 'HOST'));
    });

    socket.on('answer_result', (result: AnswerResult) => {
      setAnswerResult(result);
    });

    socket.on('game_over', ({ winner: w }: { winner: LeaderboardEntry }) => {
      setWinner(w);
      setGameState('finished');
    });

    return () => {
      socket.off('room_info');
      socket.off('error');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('game_started');
      socket.off('new_question');
      socket.off('question_ended');
      socket.off('update_leaderboard');
      socket.off('answer_result');
      socket.off('game_over');
    };
  }, [socket, roomId, playerName, isHost]);

  // Timer countdown
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const id = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(id);
    }
  }, [gameState, timeLeft]);

  const startGame = () => {
    if (socket && roomId) socket.emit('start_game', { roomCode: roomId });
  };

  const submitAnswer = (ans: string) => {
    if (selectedAnswer || isHost || gameState !== 'playing') return;
    setSelectedAnswer(ans);
    const timeTaken = timeLimit - timeLeft;
    socket?.emit('submit_answer', { roomCode: roomId, userName: playerName, answer: ans, timeTaken });
  };

  const submitWord = () => {
    if (!wordInput.trim() || selectedAnswer || isHost || gameState !== 'playing') return;
    submitAnswer(wordInput.trim());
  };

  const getOptionClass = (opt: string) => {
    if (gameState === 'question_ended') {
      if (opt === correctAnswer) return 'bg-green-500/20 border-green-400 text-white';
      if (opt === selectedAnswer && opt !== correctAnswer) return 'bg-red-500/20 border-red-400 text-red-300';
      return 'bg-slate-800/30 border-slate-700/50 text-slate-400';
    }
    if (selectedAnswer === opt) return 'bg-brand-500 border-brand-400 text-white shadow-lg shadow-brand-500/30';
    return 'bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-slate-600';
  };

  if (roomError) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="glass-card p-8 text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Room Not Found</h2>
          <p className="text-slate-400 mb-6">{roomError}</p>
          <button onClick={() => window.location.href = '/'} className="bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center items-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl"
      >
        {/* LOBBY */}
        {gameState === 'lobby' && (
          <div className="glass-card p-8 md:p-12 text-center rounded-3xl border border-white/20 shadow-2xl">
            <div className="inline-block bg-white/10 text-brand-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-4 border border-brand-500/30">
              {GAME_LABELS[gameType] ?? gameType}
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
              Room:{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-indigo-300 font-mono tracking-widest">
                {roomId}
              </span>
            </h2>
            <div className="flex items-center justify-center gap-2 mb-8 text-slate-300">
              <Users className="w-5 h-5 text-brand-400" />
              <span className="text-xl font-semibold">{players.length} Players connected</span>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-12 min-h-[50px]">
              {players.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-white/10 px-4 py-2 rounded-full border border-white/10 flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="font-medium text-white">{p}</span>
                </motion.div>
              ))}
            </div>

            {isHost ? (
              <button
                onClick={startGame}
                disabled={players.length === 0}
                className="bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-400 text-white font-bold text-xl py-4 px-10 rounded-2xl flex mx-auto items-center gap-3 transition-transform hover:scale-105 disabled:opacity-50"
              >
                <Play className="fill-current w-6 h-6" /> Start Game
              </button>
            ) : (
              <div className="text-lg text-slate-400 animate-pulse">Waiting for host to start...</div>
            )}
          </div>
        )}

        {/* QUESTION — TRIVIA & TRUE_OR_FALSE */}
        {(gameState === 'playing' || gameState === 'question_ended') && question && gameType !== 'WORD_SCRAMBLE' && (
          <div className="glass-card p-8 md:p-12 rounded-3xl relative">
            <TimerBar timeLeft={timeLeft} timeLimit={timeLimit} />

            <div className="flex justify-between items-center mb-6 mt-4">
              <div className="text-slate-400 font-semibold text-sm uppercase tracking-widest">
                Question {questionNumber} / {totalQuestions}
              </div>
              <div className={`flex items-center gap-2 font-bold text-2xl ${timeLeft < 5 ? 'text-red-400 animate-pulse' : 'text-brand-400'}`}>
                <Clock className="w-6 h-6" /> {timeLeft}s
              </div>
            </div>

            <h3 className="text-2xl md:text-3xl font-bold text-white mb-10 text-center leading-tight">
              {question}
            </h3>

            {!isHost ? (
              <div className={`grid gap-4 ${gameType === 'TRUE_OR_FALSE' ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => submitAnswer(opt)}
                    disabled={!!selectedAnswer || gameState === 'question_ended'}
                    className={`p-6 rounded-2xl text-xl font-semibold border-2 transition-all transform hover:scale-[1.02] active:scale-95 flex justify-between items-center disabled:hover:scale-100 ${getOptionClass(opt)} ${gameType === 'TRUE_OR_FALSE' ? 'justify-center text-2xl py-8' : ''}`}
                  >
                    <span>{opt}</span>
                    {gameState === 'question_ended' && opt === correctAnswer && <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />}
                    {gameState === 'question_ended' && opt === selectedAnswer && opt !== correctAnswer && <XCircle className="w-6 h-6 text-red-400 shrink-0" />}
                    {gameState === 'playing' && selectedAnswer === opt && <CheckCircle2 className="w-6 h-6 shrink-0" />}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-300 text-xl py-10">
                {gameState === 'playing' ? 'Players are answering...' : 'Showing results...'}
              </div>
            )}

            <AnswerResultToast result={answerResult} />
          </div>
        )}

        {/* QUESTION — WORD SCRAMBLE */}
        {(gameState === 'playing' || gameState === 'question_ended') && question && gameType === 'WORD_SCRAMBLE' && (
          <div className="glass-card p-8 md:p-12 rounded-3xl relative">
            <TimerBar timeLeft={timeLeft} timeLimit={timeLimit} />

            <div className="flex justify-between items-center mb-6 mt-4">
              <div className="text-slate-400 font-semibold text-sm uppercase tracking-widest">
                Question {questionNumber} / {totalQuestions}
              </div>
              <div className={`flex items-center gap-2 font-bold text-2xl ${timeLeft < 8 ? 'text-red-400 animate-pulse' : 'text-brand-400'}`}>
                <Clock className="w-6 h-6" /> {timeLeft}s
              </div>
            </div>

            <p className="text-slate-400 text-center mb-2 font-medium">{question}</p>

            <div className="flex justify-center gap-2 flex-wrap my-8">
              {scrambledWord.split('').map((ch, i) => (
                <span
                  key={i}
                  className="w-12 h-14 flex items-center justify-center bg-brand-500/20 border-2 border-brand-500/40 rounded-xl text-3xl font-extrabold text-brand-200 tracking-widest"
                >
                  {ch}
                </span>
              ))}
            </div>

            {gameState === 'question_ended' && (
              <div className="text-center mb-6">
                <span className="text-slate-400">The word was: </span>
                <span className="text-green-400 font-bold text-2xl">{correctAnswer}</span>
              </div>
            )}

            {!isHost && gameState === 'playing' && (
              <div className="flex gap-3 max-w-md mx-auto">
                <input
                  ref={wordInputRef}
                  type="text"
                  value={wordInput}
                  onChange={e => setWordInput(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && submitWord()}
                  disabled={!!selectedAnswer}
                  className="flex-1 bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-3 text-white text-center text-xl font-mono tracking-widest placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase disabled:opacity-50"
                  placeholder="TYPE YOUR ANSWER"
                  maxLength={20}
                />
                <button
                  onClick={submitWord}
                  disabled={!!selectedAnswer || !wordInput.trim()}
                  className="bg-brand-500 hover:bg-brand-400 text-white px-5 py-3 rounded-xl disabled:opacity-50 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}

            {!isHost && selectedAnswer && gameState === 'playing' && (
              <p className="text-center text-slate-300 mt-4">
                Submitted: <span className="text-brand-300 font-mono font-bold">{selectedAnswer}</span>
              </p>
            )}

            {isHost && (
              <div className="text-center text-slate-300 text-xl py-4">
                {gameState === 'playing' ? 'Players are unscrambling...' : 'Time\'s up!'}
              </div>
            )}

            <AnswerResultToast result={answerResult} />
          </div>
        )}

        {/* LEADERBOARD after question (visible to all) */}
        {gameState === 'question_ended' && leaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 glass-card p-6 rounded-3xl"
          >
            <h3 className="text-xl font-bold text-white mb-4 text-center">Leaderboard</h3>
            <div className="flex flex-col gap-2">
              {leaderboard.map((entry, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                  <span className="font-bold text-white flex items-center gap-3">
                    <span className={`w-7 text-center font-mono ${RANK_COLORS[idx] ?? 'text-slate-400'}`}>
                      #{idx + 1}
                    </span>
                    {entry.name}
                  </span>
                  <span className="font-mono text-lg text-brand-300">{entry.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* GAME OVER */}
        {gameState === 'finished' && winner && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-12 text-center rounded-3xl border border-yellow-500/30 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-yellow-500/5 z-0" />
            <div className="relative z-10">
              <Trophy className="w-24 h-24 mx-auto text-yellow-400 mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
              <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-yellow-600 mb-2">
                {winner.name} Wins!
              </h1>
              <p className="text-2xl text-slate-300 mb-10">
                Final Score: <span className="text-white font-bold">{winner.score.toLocaleString()}</span>
              </p>

              {leaderboard.length > 1 && (
                <div className="flex flex-col gap-2 mb-10 max-w-sm mx-auto">
                  {leaderboard.map((entry, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                      <span className={`font-bold ${RANK_COLORS[idx] ?? 'text-slate-300'}`}>
                        #{idx + 1} {entry.name}
                      </span>
                      <span className="font-mono text-brand-300">{entry.score.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => window.location.href = '/'}
                className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl border border-white/20 font-semibold transition-all"
              >
                Return Home
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function TimerBar({ timeLeft, timeLimit }: { timeLeft: number; timeLimit: number }) {
  return (
    <div className="absolute top-0 left-0 w-full h-2 bg-slate-800 rounded-t-3xl overflow-hidden">
      <motion.div
        className={`h-full ${timeLeft < 5 ? 'bg-red-500' : 'bg-brand-400'}`}
        initial={{ width: '100%' }}
        animate={{ width: `${(timeLeft / timeLimit) * 100}%` }}
        transition={{ duration: 1, ease: 'linear' }}
      />
    </div>
  );
}

function AnswerResultToast({ result }: { result: AnswerResult | null }) {
  if (!result) return null;
  return (
    <AnimatePresence>
      <motion.div
        key="toast"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`mt-6 text-center px-6 py-3 rounded-2xl font-bold text-lg ${
          result.correct
            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
            : 'bg-red-500/20 text-red-300 border border-red-500/30'
        }`}
      >
        {result.correct ? `+${result.points} pts — Correct!` : 'Wrong answer!'}
      </motion.div>
    </AnimatePresence>
  );
}
