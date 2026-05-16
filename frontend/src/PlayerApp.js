import React, { useState, useMemo, useCallback } from 'react';
import { Menu, LogOut } from 'lucide-react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import Player from './components/Player';
import QueuePanel from './components/QueuePanel';
import AppBackground from './components/AppBackground';
import { usePlayer } from './hooks/usePlayer';
import { useLibrary } from './hooks/useLibrary';
import { useAuth } from './context/AuthContext';
import { LOGO_ICON } from './constants/assets';
import AboutModal from './components/AboutModal';
import { sortSongs } from './utils/sort';

const SORT_KEY = 'onyx_sort';

function loadSortPreference() {
  try {
    const raw = localStorage.getItem(SORT_KEY);
    if (!raw) return { sortBy: 'title', sortDir: 'asc' };
    const parsed = JSON.parse(raw);
    return {
      sortBy: parsed.sortBy === 'artist' ? 'artist' : 'title',
      sortDir: parsed.sortDir === 'desc' ? 'desc' : 'asc',
    };
  } catch {
    return { sortBy: 'title', sortDir: 'asc' };
  }
}

function PlayerApp() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [{ sortBy, sortDir }, setSort] = useState(loadSortPreference);

  const player = usePlayer();
  const library = useLibrary(user);

  const handleSortChange = useCallback((by, dir) => {
    setSort({ sortBy: by, sortDir: dir });
    localStorage.setItem(SORT_KEY, JSON.stringify({ sortBy: by, sortDir: dir }));
  }, []);

  const viewSongs = useMemo(() => {
    let list = library.filterSongs(player.songs);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.artist && s.artist.toLowerCase().includes(q)) ||
          s.filename.toLowerCase().includes(q)
      );
    }
    if (library.view.type !== 'playlist') {
      list = sortSongs(list, sortBy, sortDir);
    }
    return list;
  }, [player.songs, library, searchQuery, sortBy, sortDir]);

  const handleSongSelect = (song) => {
    if (player.currentSong?.filename === song.filename) {
      player.handlePlayPause();
    } else {
      player.playNow(song);
    }
  };

  const sortEnabled = library.view.type !== 'playlist';

  return (
    <div className="flex h-[100dvh] bg-onyx-black overflow-hidden relative">
      <AppBackground />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <div className="relative z-10 flex flex-1 min-h-0 min-w-0 w-full">
        <div
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 lg:z-0 transition-transform duration-200 flex-shrink-0`}
        >
          <Sidebar
            songCount={player.songs.length}
            username={user}
            onLogout={logout}
            onClose={() => setSidebarOpen(false)}
            view={library.view}
            onViewChange={(v) => {
              library.setView(v);
              library.clearSelection();
            }}
            playlists={library.playlists}
            favoritesCount={library.favorites.length}
            onCreatePlaylist={library.createPlaylist}
            onDeletePlaylist={library.deletePlaylist}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-onyx-border/80 bg-onyx-dark/80 backdrop-blur-md flex-shrink-0">
            <button type="button" onClick={() => setSidebarOpen(true)} className="text-white p-1">
              <Menu className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => setAboutOpen(true)}
              className="flex items-center gap-2 min-w-0"
              title="Acerca de"
            >
              <img
                src={LOGO_ICON}
                alt=""
                className="h-10 w-10 rounded-full object-cover border-2 border-white/20 shadow-lg flex-shrink-0"
              />
              <span className="font-bold text-white tracking-tight truncate">Onyx Music</span>
            </button>
            <button type="button" onClick={logout} className="text-onyx-muted p-1">
              <LogOut className="w-5 h-5" />
            </button>
          </header>

          {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}

          <div className="flex-1 flex min-h-0 overflow-hidden">
            <MainContent
              songs={viewSongs}
              totalCount={player.songs.length}
              viewTitle={library.getViewTitle()}
              currentSong={player.currentSong}
              isPlaying={player.isPlaying}
              onSongSelect={handleSongSelect}
              onPlayNow={player.playNow}
              onPlayNext={player.playNext}
              onAddToQueue={player.addToQueue}
              onToggleFavorite={library.toggleFavorite}
              isFavorite={library.isFavorite}
              playlists={library.playlists}
              onAddToPlaylist={library.addSongsToPlaylist}
              selected={library.selected}
              onToggleSelect={library.toggleSelect}
              onSelectAll={library.selectAll}
              onClearSelection={library.clearSelection}
              loading={player.loading}
              error={player.error}
              onRetry={player.fetchSongs}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              sortDir={sortDir}
              onSortChange={handleSortChange}
              sortEnabled={sortEnabled}
              onOpenAbout={() => setAboutOpen(true)}
            />

            <div className={`${queueOpen ? 'flex' : 'hidden'} lg:flex`}>
              <QueuePanel
                open={queueOpen}
                onClose={() => setQueueOpen(false)}
                queue={player.queue}
                queueIndex={player.queueIndex}
                onPlayAtIndex={(i) => player.playAtIndex(i, false)}
                onRemove={player.removeFromQueue}
                onReorder={player.reorderQueue}
              />
            </div>
          </div>

          <Player
            currentSong={player.currentSong}
            isPlaying={player.isPlaying}
            currentTime={player.currentTime}
            duration={player.duration}
            volume={player.volume}
            shuffle={player.shuffle}
            loopMode={player.loopMode}
            crossfade={player.crossfade}
            onPlayPause={player.handlePlayPause}
            onNext={player.advance}
            onPrevious={player.handlePrevious}
            onSeek={player.handleSeek}
            onVolumeChange={player.setVolume}
            onToggleShuffle={() => player.setShuffle((s) => !s)}
            onCycleLoop={player.cycleLoop}
            onToggleCrossfade={() => player.setCrossfade((c) => !c)}
            onToggleQueue={() => setQueueOpen((o) => !o)}
          />
        </div>
      </div>
    </div>
  );
}

export default PlayerApp;
