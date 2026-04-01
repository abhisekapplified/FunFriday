import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../context/SocketContext';
import { Play, Users, Trophy, Clock, CheckCircle2 } from 'lucide-react';

interface LeaderboardEntry {
  name: string;
  score: number;
}

export default function GameRoom() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const playerName = searchParams.get('name') || 'Guest';
  const isHost = searchParams.get('host') === 'true';
  const { socket } = useSocket();

  const [players, setPlayers] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'question_ended' | 'finished'>('lobby');
  
  // Game state
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [timeLimit, setTimeLimit] = useState(15);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [winner, setWinner] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    if (!socket || !roomId) return;

    if (!isHost) {
      socket.emit('join_room', { roomCode: roomId, userName: playerName });
    } else {
      socket.emit('join_room', { roomCode: roomId, userName: 'HOST' }); // Join as host to receive events
    }

    const handleUserJoined = (data: { userName: string }) => {
      if (data.userName !== 'HOST') {
         setPlayers(prev => [...new Set([...prev, data.userName])]);
      }
    };

    const handleGameStarted = () => setGameState('playing');
    
    const handleNewQuestion = (data: { question: string, options: string[], timeLimit: number }) => {
      setQuestion(data.question);
      setOptions(data.options);
      setTimeLimit(data.timeLimit);
      setTimeLeft(data.timeLimit);
      setSelectedAnswer(null);
      setGameState('playing');
    };

    const handleQuestionEnded = () => {
      setGameState('question_ended');
    };

    const handleUpdateLeaderboard = (data: LeaderboardEntry[]) => {
      setLeaderboard(data.filter(p => p.name !== 'HOST'));
    };

    const handleGameOver = (data: { winner: LeaderboardEntry }) => {
      setWinner(data.winner);
      setGameState('finished');
    };

    socket.on('user_joined', handleUserJoined);
    socket.on('game_started', handleGameStarted);
    socket.on('new_question', handleNewQuestion);
    socket.on('question_ended', handleQuestionEnded);
    socket.on('update_leaderboard', handleUpdateLeaderboard);
    socket.on('game_over', handleGameOver);

    return () => {
      socket.off('user_joined', handleUserJoined);
      socket.off('game_started', handleGameStarted);
      socket.off('new_question', handleNewQuestion);
      socket.off('question_ended', handleQuestionEnded);
      socket.off('update_leaderboard', handleUpdateLeaderboard);
      socket.off('game_over', handleGameOver);
    };
  }, [socket, roomId, playerName, isHost]);

  // Timer logic
  useEffect(() => {
    if (gameState === 'playing' && question && timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [gameState, question, timeLeft]);

  const startGame = () => {
    if (socket && roomId) {
      socket.emit('start_game', { roomCode: roomId });
    }
  };

  const submitAnswer = (ans: string) => {
    if (selectedAnswer || isHost) return; // Prevent multiple submissions
    setSelectedAnswer(ans);
    const timeTaken = timeLimit - timeLeft;
    socket?.emit('submit_answer', { roomCode: roomId, userName: playerName, answer: ans, timeTaken });
  };

  return (
    <div className="w-full flex justify-center items-center min-h-[70vh]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl"
      >
        {gameState === 'lobby' && (
          <div className="glass-card p-8 md:p-12 text-center rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
              Room: <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-indigo-300 font-mono tracking-widest">{roomId}</span>
            </h2>
            <div className="flex flex-col items-center justify-center mb-10 text-slate-300">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-brand-400" />
                <span className="text-xl font-semibold">{players.length} Players connected</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-12 min-h-[50px]">
              {players.map((p, i) => (
                <motion.div key={i} className="bg-white/10 px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="font-medium text-white">{p}</span>
                </motion.div>
              ))}
            </div>

            {isHost ? (
              <button 
                onClick={startGame}
                className="bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-400 text-white font-bold text-xl py-4 px-10 rounded-2xl flex mx-auto items-center gap-3 transition-transform hover:scale-105"
              >
                <Play className="fill-current w-6 h-6" /> Start Game
              </button>
            ) : (
              <div className="text-lg text-slate-400 animate-pulse">Waiting for host to start...</div>
            )}
          </div>
        )}

        {(gameState === 'playing' || gameState === 'question_ended') && question && (
          <div className="glass-card p-8 md:p-12 rounded-3xl relative">
            {/* Timer Banner */}
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-800 rounded-t-3xl overflow-hidden">
              <motion.div 
                className={`h-full ${timeLeft < 5 ? 'bg-red-500' : 'bg-brand-400'}`}
                initial={{ width: '100%' }}
                animate={{ width: `${(timeLeft / timeLimit) * 100}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
            
            <div className="flex justify-between items-center mb-10 mt-4">
              <div className="text-slate-400 font-semibold uppercase tracking-widest">Question</div>
              <div className={`flex items-center gap-2 font-bold text-2xl ${timeLeft < 5 ? 'text-red-400 animate-pulse' : 'text-brand-400'}`}>
                <Clock className="w-6 h-6" /> {timeLeft}s
              </div>
            </div>

            <h3 className="text-3xl md:text-4xl font-bold text-white mb-10 text-center leading-tight">
              {question}
            </h3>

            {!isHost ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {options.map((opt, i) => (
                 <button
                   key={i}
                   onClick={() => submitAnswer(opt)}
                   disabled={!!selectedAnswer || gameState === 'question_ended'}
                   className={`p-6 rounded-2xl text-xl font-medium border-2 transition-all transform hover:scale-[1.02] active:scale-95 ${
                     selectedAnswer === opt 
                       ? 'bg-brand-500 border-brand-400 text-white shadow-lg shadow-brand-500/50' 
                       : 'bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-700'
                   } disabled:opacity-80 disabled:hover:scale-100 flex justify-between items-center`}
                 >
                   <span>{opt}</span>
                   {selectedAnswer === opt && <CheckCircle2 className="w-6 h-6" />}
                 </button>
               ))}
             </div>
            ) : (
              <div className="text-center text-slate-300 text-xl py-10">
                Players are answering...
              </div>
            )}
          </div>
        )}

        {isHost && gameState === 'question_ended' && (
          <div className="mt-8 glass-card p-8 rounded-3xl">
             <h3 className="text-2xl font-bold text-white mb-6 text-center">Live Leaderboard</h3>
             <div className="flex flex-col gap-3">
                {leaderboard.map((entry, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                    <span className="text-lg font-bold text-white flex items-center gap-3">
                      <span className="text-brand-400 w-6">{idx + 1}.</span> {entry.name}
                    </span>
                    <span className="font-mono text-xl text-brand-300">{entry.score}</span>
                  </div>
                ))}
             </div>
          </div>
        )}

        {gameState === 'finished' && winner && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-12 text-center rounded-3xl border border-yellow-500/30 overflow-hidden relative"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-yellow-500/10 z-0"></div>
            <div className="relative z-10">
              <Trophy className="w-32 h-32 mx-auto text-yellow-400 mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
              <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-yellow-600 mb-4">
                {winner.name} Wins!
              </h1>
              <p className="text-2xl text-slate-300 mb-8">Final Score: <span className="text-white font-bold">{winner.score}</span></p>
              
              <div className="flex justify-center gap-4">
                 <button onClick={() => window.location.href = '/'} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl border border-white/20 font-semibold transition-all">
                    Return Home
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
