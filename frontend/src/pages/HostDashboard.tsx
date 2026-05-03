import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Users, MonitorPlay, Zap, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

type GameType = 'TRIVIA' | 'WORD_SCRAMBLE' | 'TRUE_OR_FALSE';

interface Room {
  id: string;
  roomCode: string;
  gameType: GameType;
  status: string;
  createdAt: string;
  sessions: { id: string }[];
}

const GAME_TYPES: { value: GameType; label: string; desc: string; color: string }[] = [
  { value: 'TRIVIA', label: 'Trivia Quiz', desc: '4-option multiple choice questions. Speed scoring.', color: 'from-brand-500 to-purple-600' },
  { value: 'WORD_SCRAMBLE', label: 'Word Scramble', desc: 'Unscramble the letters to guess the word!', color: 'from-teal-500 to-cyan-600' },
  { value: 'TRUE_OR_FALSE', label: 'True or False', desc: 'Quick-fire true/false statements. Fast and fun.', color: 'from-orange-500 to-pink-600' },
];

export default function HostDashboard() {
  const { isAuthenticated, token, user } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState({ totalGames: 0, totalParticipants: 0 });
  const [showModal, setShowModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameType>('TRIVIA');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roomsData, statsData] = await Promise.all([
        apiFetch<{ rooms: Room[] }>('/api/rooms', {}, token!),
        apiFetch<{ totalGames: number; totalParticipants: number }>('/api/rooms/stats', {}, token!),
      ]);
      setRooms(roomsData.rooms);
      setStats(statsData);
    } catch (e) {
      console.error('Failed to load dashboard:', e);
    }
  };

  const handleCreateRoom = async () => {
    setError('');
    setCreating(true);
    try {
      const data = await apiFetch<{ room: Room }>('/api/rooms', {
        method: 'POST',
        body: JSON.stringify({ gameType: selectedGame }),
      }, token!);
      setShowModal(false);
      navigate(`/room/${data.room.roomCode}?host=true`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create room');
      setCreating(false);
    }
  };

  const gameLabel = (type: GameType) => GAME_TYPES.find(g => g.value === type)?.label ?? type;
  const statusColor = (status: string) =>
    status === 'FINISHED' ? 'text-slate-500' : status === 'IN_PROGRESS' ? 'text-green-400' : 'text-brand-400';

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Host Dashboard</h1>
          <p className="text-slate-400">Welcome back, <span className="text-brand-300 font-medium">{user?.name}</span></p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 text-white font-semibold py-3 px-6 rounded-xl shadow-lg flex items-center gap-2 transition-all hover:scale-105"
        >
          <PlusCircle className="w-5 h-5" />
          New Game Room
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard title="Total Games Hosted" value={String(stats.totalGames)} icon={<MonitorPlay className="text-brand-400" />} />
        <StatCard title="Total Participants" value={String(stats.totalParticipants)} icon={<Users className="text-purple-400" />} />
        <StatCard title="Active Now" value={String(rooms.filter(r => r.status === 'IN_PROGRESS').length)} icon={<Zap className="text-green-400" />} />
      </div>

      <div className="glass-card p-6 border-slate-700/50">
        <h2 className="text-xl font-bold text-white mb-6">Recent Rooms</h2>
        {rooms.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            No rooms yet. Create your first game room!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-300">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-sm">
                  <th className="pb-3 font-medium">Room Code</th>
                  <th className="pb-3 font-medium">Game Type</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Sessions</th>
                  <th className="pb-3 font-medium">Created</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 font-mono text-brand-300 tracking-widest">{room.roomCode}</td>
                    <td className="py-4">{gameLabel(room.gameType)}</td>
                    <td className={`py-4 font-medium ${statusColor(room.status)}`}>{room.status}</td>
                    <td className="py-4">{room.sessions.length}</td>
                    <td className="py-4 text-slate-500 text-sm">{new Date(room.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 text-right">
                      {room.status === 'WAITING' && (
                        <button
                          onClick={() => navigate(`/room/${room.roomCode}?host=true`)}
                          className="text-sm border border-brand-600 text-brand-400 rounded-lg px-3 py-1.5 hover:bg-brand-600/20 transition-colors flex items-center gap-1 ml-auto"
                        >
                          Open <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 w-full max-w-lg relative"
            >
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold text-white mb-2">Create Game Room</h2>
              <p className="text-slate-400 mb-6">Select a game type for this room</p>

              {error && (
                <div className="bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl px-4 py-3 text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 mb-8">
                {GAME_TYPES.map(g => (
                  <button
                    key={g.value}
                    onClick={() => setSelectedGame(g.value)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      selectedGame === g.value
                        ? 'border-brand-400 bg-brand-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${g.color}`} />
                      <div>
                        <div className="font-semibold text-white">{g.label}</div>
                        <div className="text-slate-400 text-sm">{g.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={creating}
                className="w-full bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
              >
                <PlusCircle className="w-5 h-5" />
                {creating ? 'Creating...' : 'Create & Enter Room'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="glass-card p-6 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <span className="text-slate-400 font-medium">{title}</span>
        <div className="p-2 bg-slate-800 rounded-lg">{icon}</div>
      </div>
      <div className="text-4xl font-bold text-white">{value}</div>
    </motion.div>
  );
}
