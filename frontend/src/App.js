import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import PlayerApp from './PlayerApp';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-onyx-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-onyx-border border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <PlayerApp /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
