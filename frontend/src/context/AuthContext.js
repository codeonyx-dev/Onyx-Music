import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch, getToken, getUsername, setSession, clearSession, API_URL } from '../config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUsername());
  const [loading, setLoading] = useState(!!getToken());

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const login = useCallback(async (username, password) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    setSession(data.token, data.username);
    setUser(data.username);
    return data;
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    apiFetch('/api/auth/me')
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser(data.username);
        } else {
          logout();
        }
      })
      .catch(logout)
      .finally(() => setLoading(false));
  }, [logout]);

  useEffect(() => {
    const onLogout = () => logout();
    window.addEventListener('onyx:logout', onLogout);
    return () => window.removeEventListener('onyx:logout', onLogout);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
