import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, token: null, isAuthenticated: false,
  login: async () => {}, register: async () => {}, logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ff_token'));

  useEffect(() => {
    const stored = localStorage.getItem('ff_user');
    if (stored && token) {
      try { setUser(JSON.parse(stored)); } catch { logout(); }
    }
  }, []);

  const persist = (t: string, u: AuthUser) => {
    setToken(t);
    setUser(u);
    localStorage.setItem('ff_token', t);
    localStorage.setItem('ff_user', JSON.stringify(u));
  };

  const login = async (email: string, password: string) => {
    const data = await apiFetch<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    persist(data.token, data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await apiFetch<{ token: string; user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    persist(data.token, data.user);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ff_token');
    localStorage.removeItem('ff_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user && !!token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
