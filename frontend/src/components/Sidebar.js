import React, { useState } from 'react';
import {
  LogOut, X, Library, Heart, ListMusic, Plus, Trash2, HardDrive, Users,
} from 'lucide-react';

import { LOGO_ICON } from '../constants/assets';
import AboutModal from './AboutModal';

function Sidebar({
  songCount,
  username,
  onLogout,
  onClose,
  view,
  onViewChange,
  playlists,
  favoritesCount,
  onCreatePlaylist,
  onDeletePlaylist,
}) {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const navBtn = (active) =>
    `w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
      active ? 'bg-onyx-panel text-white' : 'text-onyx-muted hover:text-white hover:bg-onyx-panel/60'
    }`;

  const handleCreate = (e) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowNewPlaylist(false);
    }
  };

  return (
    <aside className="w-64 h-full onyx-glass flex flex-col border-r border-onyx-border/80">
      <div className="px-5 py-5 border-b border-onyx-border/80 flex items-center justify-between gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => setAboutOpen(true)}
          className="flex items-center gap-3 min-w-0 text-left group flex-1"
          title="Acerca de"
        >
          <img
            src={LOGO_ICON}
            alt=""
            className="h-11 w-11 rounded-full object-cover border-2 border-white/20 shadow-lg flex-shrink-0 group-hover:border-white/40 transition-colors"
          />
          <span className="text-lg font-bold text-white tracking-tight truncate group-hover:text-white/90">
            Onyx Music
          </span>
        </button>
        {onClose && (
          <button type="button" onClick={onClose} className="lg:hidden text-onyx-muted hover:text-white flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <section>
          <p className="px-3 text-xs font-semibold text-onyx-muted uppercase tracking-wider mb-2">Biblioteca</p>
          <button type="button" className={navBtn(view.type === 'library')} onClick={() => onViewChange({ type: 'library' })}>
            <Library className="w-5 h-5 flex-shrink-0" />
            Todas las canciones
          </button>
          <button
            type="button"
            className={navBtn(view.type === 'artists' || view.type === 'artist' || view.type === 'album')}
            onClick={() => onViewChange({ type: 'artists' })}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            Artistas
          </button>
          <button type="button" className={navBtn(view.type === 'favorites')} onClick={() => onViewChange({ type: 'favorites' })}>
            <Heart className={`w-5 h-5 flex-shrink-0 ${view.type === 'favorites' ? 'fill-current' : ''}`} />
            Favoritos
            {favoritesCount > 0 && (
              <span className="ml-auto text-xs bg-onyx-black px-1.5 py-0.5 rounded">{favoritesCount}</span>
            )}
          </button>
        </section>

        <section>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-xs font-semibold text-onyx-muted uppercase tracking-wider">Listas</p>
            <button
              type="button"
              onClick={() => setShowNewPlaylist((s) => !s)}
              className="text-onyx-muted hover:text-white p-0.5"
              title="Nueva lista"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showNewPlaylist && (
            <form onSubmit={handleCreate} className="px-2 mb-2">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Nombre de la lista..."
                className="w-full px-2 py-1.5 text-sm bg-onyx-panel border border-onyx-border text-white focus:outline-none focus:border-white/40"
                autoFocus
              />
            </form>
          )}

          <ul className="space-y-0.5">
            {playlists.length === 0 && (
              <li className="px-3 py-2 text-xs text-onyx-muted">Sin listas. Pulsa + para crear una.</li>
            )}
            {playlists.map((pl) => (
              <li key={pl.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  className={`${navBtn(view.type === 'playlist' && view.id === pl.id)} flex-1 min-w-0`}
                  onClick={() => onViewChange({ type: 'playlist', id: pl.id })}
                >
                  <ListMusic className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{pl.name}</span>
                  <span className="ml-auto text-xs text-onyx-muted">{pl.songs.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeletePlaylist(pl.id)}
                  className="p-1.5 text-onyx-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  title="Eliminar lista"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="px-3">
          <div className="onyx-glass-panel p-3 border border-onyx-border/80">
            <div className="flex items-center gap-2 mb-1">
              <HardDrive className="w-4 h-4 text-onyx-muted" />
              <span className="text-xs text-onyx-muted">Canciones en disco</span>
            </div>
            <p className="text-2xl font-bold text-white">{songCount}</p>
            {username && <p className="text-xs text-onyx-muted mt-2 truncate">Sesión: {username}</p>}
          </div>
        </section>
      </nav>

      <div className="px-3 py-4 border-t border-onyx-border flex-shrink-0">
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-onyx-muted hover:text-white hover:bg-onyx-panel transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
