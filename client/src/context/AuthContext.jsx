import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('sm_token'));
  const [loading, setLoading] = useState(true);

  // ─── Bootstrap: fetch current user on mount ────────────────────────────────
  useEffect(() => {
    const bootstrap = async () => {
      if (!token) { setLoading(false); return; }
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const saveAuth = (tkn, usr) => {
    localStorage.setItem('sm_token', tkn);
    api.defaults.headers.common['Authorization'] = `Bearer ${tkn}`;
    setToken(tkn);
    setUser(usr);
  };

  const clearAuth = () => {
    localStorage.removeItem('sm_token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    saveAuth(res.data.token, res.data.user);
    toast.success(`Welcome back, ${res.data.user.name}!`);
    return res.data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    saveAuth(res.data.token, res.data.user);
    toast.success('Account created successfully!');
    return res.data;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    toast.success('Logged out successfully');
  }, []);

  const updateProfile = useCallback(async (data) => {
    const res = await api.put('/auth/profile', data);
    setUser(res.data.user);
    toast.success('Profile updated');
    return res.data;
  }, []);

  const isAdmin    = user?.role === 'admin';
  const isOperator = user?.role === 'operator' || isAdmin;

  return (
    <AuthContext.Provider
      value={{ user, token, loading, isAdmin, isOperator, login, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
