import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      const status = err?.response?.status;

      // Токен удаляем ТОЛЬКО если реально неавторизованы
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        setUser(null);
      } else {
        // network/500/etc: не трогаем токен, просто логируем
        console.error('checkAuth failed (non-auth error):', err?.message || err);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const res = await api.post('/auth/login', credentials);
      const { token, user } = res.data;

      localStorage.setItem('token', token);
      setUser(user);

      return { success: true };
    } catch (err) {
      console.error('Ошибка входа:', err);
      return {
        success: false,
        error: err?.response?.data?.error || err?.message || 'Ошибка входа',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
