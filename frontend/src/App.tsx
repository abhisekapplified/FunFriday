import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Home from './pages/Home';
import HostDashboard from './pages/HostDashboard';
import GameRoom from './pages/GameRoom';
import Navbar from './components/layout/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen flex flex-col pt-16 relative overflow-hidden bg-slate-900">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/30 rounded-full blur-[120px]" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand-500/20 rounded-full blur-[150px]" />
            </div>

            <Navbar />

            <main className="flex-1 relative z-10 p-6 md:p-12 max-w-7xl mx-auto w-full">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<HostDashboard />} />
                <Route path="/room/:roomId" element={<GameRoom />} />
              </Routes>
            </main>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
