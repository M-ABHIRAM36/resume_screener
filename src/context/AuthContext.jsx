import React, { createContext, useContext, useState, useEffect } from 'react';
import { post, get } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // On mount, try to restore session
  useEffect(() => {
    async function restore() {
      const saved = localStorage.getItem('token');
      if (saved) {
        try {
          const res = await get('/api/auth/me');
          setUser(res.user);
          setToken(saved);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    restore();
  }, []);

  const login = async (email, password) => {
    const res = await post('/api/auth/login', { email, password });
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const signup = async (name, email, password, role, companyName) => {
    const res = await post('/api/auth/signup', { name, email, password, role, companyName });
    localStorage.setItem('token', res.token);
    localStorage.setItem('user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;
  const isCandidate = user?.role === 'candidate';
  const isHR = user?.role === 'hr';

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, signup, logout,
      isAuthenticated, isCandidate, isHR
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
