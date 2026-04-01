import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

export default function Home() {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const navigate = useNavigate();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode && playerName) {
      navigate(`/room/${roomCode}?name=${encodeURIComponent(playerName)}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-brand-300 via-purple-300 to-indigo-400 mb-4 drop-shadow-sm">
            Ready to Play?
          </h1>
          <p className="text-slate-400 text-lg">Join your team's game room and let the fun begin!</p>
        </div>

        <form onSubmit={handleJoin} className="glass-card p-8 flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Display Name</label>
            <input 
              type="text" 
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
              placeholder="e.g. Crazy Coyote"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Room Code</label>
            <input 
              type="text" 
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-mono text-center tracking-widest uppercase"
              placeholder="A B C D E F"
              maxLength={6}
              required
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-brand-500/20 transform transition-all hover:scale-[1.02] active:scale-95 flex justify-center items-center gap-2 mt-2"
          >
            <Play fill="currentColor" className="w-5 h-5" />
            Join Game
          </button>
        </form>
      </motion.div>
    </div>
  );
}
