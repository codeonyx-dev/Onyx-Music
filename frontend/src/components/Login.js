import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

import { FONDO, LOGO } from '../constants/assets';

function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${FONDO})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/75" aria-hidden />

      <div className="relative w-full max-w-md border border-onyx-border/80 onyx-glass p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <img src={LOGO} alt="Onyx Music" className="h-28 w-auto object-contain mb-4" />
          <p className="text-xs text-onyx-muted">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-onyx-muted uppercase tracking-wider mb-1.5">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2.5 bg-onyx-panel/80 border border-onyx-border text-white text-sm focus:outline-none focus:border-cyan-400/50"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-onyx-muted uppercase tracking-wider mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-onyx-panel/80 border border-onyx-border text-white text-sm focus:outline-none focus:border-cyan-400/50"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white text-black text-sm font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

      </div>
    </div>
  );
}

export default Login;
