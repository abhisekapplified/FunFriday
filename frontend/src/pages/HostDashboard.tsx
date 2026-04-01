import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, Settings, Users, MonitorPlay } from 'lucide-react';

export default function HostDashboard() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = () => {
    setIsCreating(true);
    // Simulate API call to create room
    setTimeout(() => {
      const mockCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      navigate(`/room/${mockCode}?host=true`);
    }, 1000);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Host Dashboard</h1>
          <p className="text-slate-400">Manage your games and rooms</p>
        </div>
        <button 
          onClick={handleCreateRoom}
          disabled={isCreating}
          className="bg-brand-500 hover:bg-brand-400 text-white font-semibold py-3 px-6 rounded-xl shadow-lg flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <PlusCircle className="w-5 h-5" />
          {isCreating ? 'Creating...' : 'New Game Room'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Games Hosted" value="12" icon={<MonitorPlay className="text-brand-400" />} />
        <StatCard title="Total Participants" value="148" icon={<Users className="text-purple-400" />} />
        <StatCard title="Upcoming Sessions" value="2" icon={<Settings className="text-indigo-400" />} />
      </div>

      <div className="mt-12 glass-card p-6 border-slate-700/50">
        <h2 className="text-xl font-bold text-white mb-6">Recent Games</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-sm">
                <th className="pb-3 font-medium">Room Code</th>
                <th className="pb-3 font-medium">Game Type</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Players</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {['K8J9PX', 'M2V4Q1', 'X7B3N9'].map((code, i) => (
                <tr key={code} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 font-mono text-brand-300">{code}</td>
                  <td className="py-4">Multiplayer Quiz</td>
                  <td className="py-4">Oct {12 - i}, 2023</td>
                  <td className="py-4">{Math.floor(Math.random() * 20) + 5}</td>
                  <td className="py-4 text-right">
                    <button className="text-sm border border-slate-600 rounded-lg px-3 py-1.5 hover:bg-slate-700 transition-colors">
                      View Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-card p-6 flex flex-col gap-4"
    >
      <div className="flex justify-between items-center">
        <span className="text-slate-400 font-medium">{title}</span>
        <div className="p-2 bg-slate-800 rounded-lg">{icon}</div>
      </div>
      <div className="text-4xl font-bold text-white">{value}</div>
    </motion.div>
  );
}
