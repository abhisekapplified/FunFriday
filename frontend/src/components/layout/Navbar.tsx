import { Link } from 'react-router-dom';
import { Gamepad2, UserCircle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export default function Navbar() {
  const { isConnected } = useSocket();

  return (
    <nav className="fixed top-0 w-full z-50 glass border-b-0 border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-brand-500 p-2 rounded-xl group-hover:bg-brand-400 transition-colors">
            <Gamepad2 className="text-white w-6 h-6 animate-pulse-fast" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-300 to-purple-400">
            Fun Friday
          </span>
        </Link>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-red-400'}`}></div>
            <span className="text-sm text-slate-300 font-medium hidden sm:block">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <Link to="/dashboard" className="flex items-center gap-2 text-slate-200 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-lg border border-white/5 hover:bg-white/10">
            <UserCircle className="w-5 h-5" />
            <span className="font-semibold">Host Login</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
