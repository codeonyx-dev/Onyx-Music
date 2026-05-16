import React, { useState } from 'react';
import {
  Play, Pause, Music, RefreshCw, AlertCircle, Search,
  Download, Heart, CheckSquare, Square, X, ArrowUpDown,
} from 'lucide-react';
import AlbumArt from './AlbumArt';
import SongMenu from './SongMenu';
import { formatTime } from '../utils/format';
import { downloadSongs } from '../utils/download';
import { songRef } from '../utils/songKey';
import BrowseGrid from './BrowseGrid';

function MainContent({
  songs,
  totalCount,
  viewTitle,
  currentSong,
  isPlaying,
  onSongSelect,
  onPlayNow,
  onPlayNext,
  onAddToQueue,
  onToggleFavorite,
  isFavorite,
  playlists,
  onAddToPlaylist,
  selected,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  loading,
  error,
  onRetry,
  onRescan,
  searchQuery,
  onSearchChange,
  sortBy,
  sortDir,
  onSortChange,
  sortEnabled,
  onOpenAbout,
  viewType = 'library',
  browseArtists = [],
  browseAlbums = [],
  onSelectArtist,
  onSelectAlbum,
  onPlayBrowseItem,
  onBrowseBack,
}) {
  const isLibraryView = viewTitle === 'Tu Biblioteca';
  const isBrowse = viewType === 'artists' || viewType === 'artist';
  const showSongTable = !isBrowse;
  const [downloading, setDownloading] = useState(false);
  const allSelected = songs.length > 0 && songs.every((s) => selected.has(songRef(s)));
  const selectedCount = selected.size;

  const formatFileSize = (bytes) => {
    if (!bytes) return '--';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownloadSelected = async () => {
    const files = [...selected];
    if (files.length === 0) return;
    setDownloading(true);
    try {
      await downloadSongs(files);
    } catch (err) {
      console.error(err);
      alert('Error al descargar algunos archivos');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-transparent min-w-0">
      <div className="sticky top-0 z-10 bg-black/85 border-b border-onyx-border/80 px-4 sm:px-8 py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              {isLibraryView ? (
                <button
                  type="button"
                  onClick={onOpenAbout}
                  className="text-left group"
                  title="Acerca de"
                >
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-white/85 transition-colors">
                    Onyx Music
                  </h2>
                </button>
              ) : (
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{viewTitle}</h2>
              )}
              <p className="text-sm text-onyx-muted mt-1">
                {isBrowse
                  ? viewType === 'artists'
                    ? `${browseArtists.length} artistas`
                    : `${browseAlbums.length} álbumes`
                  : `${songs.length} ${songs.length === 1 ? 'canción' : 'canciones'}${
                      !isLibraryView && totalCount > 0 ? ` · ${totalCount} en total` : ''
                    }`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {onBrowseBack && (
                <button
                  type="button"
                  onClick={onBrowseBack}
                  className="px-3 py-2 text-sm onyx-glass-panel border border-onyx-border text-onyx-muted hover:text-white"
                >
                  ← Volver
                </button>
              )}
              {sortEnabled && showSongTable && (
                <div className="relative flex items-center">
                  <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-onyx-muted pointer-events-none" />
                  <select
                    value={`${sortBy}-${sortDir}`}
                    onChange={(e) => {
                      const [by, dir] = e.target.value.split('-');
                      onSortChange(by, dir);
                    }}
                    className="pl-9 pr-2 py-2 onyx-glass-panel border border-onyx-border text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-white/40"
                    aria-label="Ordenar canciones"
                  >
                    <option value="title-asc">Nombre A → Z</option>
                    <option value="title-desc">Nombre Z → A</option>
                    <option value="artist-asc">Artista A → Z</option>
                    <option value="artist-desc">Artista Z → A</option>
                  </select>
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-onyx-muted" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Buscar..."
                  className="pl-9 pr-3 py-2 onyx-glass-panel border border-onyx-border text-sm text-white w-40 sm:w-52 focus:outline-none focus:border-white/40"
                />
              </div>
              <button
                type="button"
                onClick={onRescan || onRetry}
                className="p-2 onyx-glass-panel border border-onyx-border text-white hover:bg-onyx-hover"
                title="Reescanear biblioteca"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showSongTable && songs.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <button
                type="button"
                onClick={() => (allSelected ? onClearSelection() : onSelectAll(songs.map((s) => songRef(s))))}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-onyx-border text-onyx-muted hover:text-white hover:bg-onyx-panel"
              >
                {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                {allSelected ? 'Deseleccionar' : 'Seleccionar todo'}
              </button>
              {selectedCount > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleDownloadSelected}
                    disabled={downloading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black font-medium hover:bg-gray-200 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    {downloading ? 'Descargando...' : `Descargar (${selectedCount})`}
                  </button>
                  <button
                    type="button"
                    onClick={onClearSelection}
                    className="p-1.5 text-onyx-muted hover:text-white"
                    title="Limpiar selección"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-onyx-border border-t-white rounded-full animate-spin mb-4" />
            <p className="text-onyx-muted">Cargando biblioteca...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-12 h-12 text-onyx-muted mb-4" />
            <p className="text-onyx-muted mb-4 text-center max-w-md">{error}</p>
            <button type="button" onClick={onRetry} className="px-4 py-2 bg-white text-black text-sm font-medium">
              Reintentar
            </button>
          </div>
        ) : isBrowse ? (
          <BrowseGrid
            mode={viewType === 'artists' ? 'artists' : 'albums'}
            items={viewType === 'artists' ? browseArtists : browseAlbums}
            onSelect={viewType === 'artists' ? onSelectArtist : onSelectAlbum}
            onPlayAll={onPlayBrowseItem}
          />
        ) : songs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Music className="w-16 h-16 text-onyx-border mb-4" />
            <p className="text-lg text-white font-medium mb-2">No hay canciones aquí</p>
            <p className="text-sm text-onyx-muted text-center max-w-sm">
              {viewTitle === 'Favoritos'
                ? 'Marca canciones con el corazón para añadirlas a favoritos.'
                : !isLibraryView
                ? 'Añade canciones desde el menú ⋯ de cada pista.'
                : 'Coloca archivos en la carpeta music/ y pulsa Actualizar.'}
            </p>
          </div>
        ) : (
          <div className="onyx-glass-panel border border-onyx-border/80">
            <div className="hidden sm:grid grid-cols-[auto_auto_1fr_auto_auto_auto_auto] gap-3 px-4 py-3 border-b border-onyx-border/80 text-xs font-semibold text-onyx-muted uppercase">
              <span className="w-6" />
              <span className="w-8 text-center">#</span>
              <span>Título</span>
              <span>Duración</span>
              <span className="hidden lg:block">Tamaño</span>
              <span className="w-8" />
              <span className="w-8" />
            </div>

            {songs.map((song, index) => {
              const ref = songRef(song);
              const isCurrent = currentSong && songRef(currentSong) === ref;
              const isActive = isCurrent && isPlaying;
              const fav = isFavorite(song);
              const checked = selected.has(ref);

              return (
                <div
                  key={ref}
                  className={`group grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_auto_1fr_auto_auto_auto_auto] gap-2 sm:gap-3 px-3 sm:px-4 py-3 items-center border-b border-onyx-border last:border-b-0 cursor-pointer transition-colors ${
                    isCurrent ? 'bg-onyx-hover' : 'hover:bg-onyx-hover/50'
                  } ${checked ? 'ring-1 ring-inset ring-white/20' : ''}`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelect(ref);
                    }}
                    className={`w-6 flex-shrink-0 ${checked ? 'text-white' : 'text-onyx-muted opacity-60 group-hover:opacity-100'}`}
                  >
                    {checked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>

                  <span
                    className="hidden sm:block w-8 text-center text-sm text-onyx-muted"
                    onClick={() => onSongSelect(song)}
                  >
                    {isActive ? (
                      <div className="flex items-end justify-center gap-0.5 h-4 mx-auto">
                        <div className="w-1 bg-white animate-pulse" style={{ height: '60%' }} />
                        <div className="w-1 bg-white animate-pulse" style={{ height: '100%', animationDelay: '150ms' }} />
                        <div className="w-1 bg-white animate-pulse" style={{ height: '40%', animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      index + 1
                    )}
                  </span>

                  <div className="flex items-center gap-3 min-w-0" onClick={() => onSongSelect(song)}>
                    <AlbumArt mediaRef={ref} size="sm" className={isCurrent ? 'ring-1 ring-white' : ''} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium truncate ${isCurrent ? 'text-white' : 'text-onyx-text'}`}>
                        {song.title}
                      </p>
                      <p className="text-xs text-onyx-muted truncate">
                        {song.artist || 'Artista desconocido'}
                        {song.album ? ` · ${song.album}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(ref);
                      }}
                      className={`p-1 flex-shrink-0 ${fav ? 'text-red-400' : 'text-onyx-muted opacity-0 group-hover:opacity-100'}`}
                    >
                      <Heart className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <span className="hidden sm:block text-sm text-onyx-muted tabular-nums" onClick={() => onSongSelect(song)}>
                    {song.duration > 0 ? formatTime(song.duration) : '--:--'}
                  </span>

                  <span className="hidden lg:block text-sm text-onyx-muted" onClick={() => onSongSelect(song)}>
                    {formatFileSize(song.size)}
                  </span>

                  <span className="w-8 flex justify-center" onClick={() => onSongSelect(song)}>
                    {isActive ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-onyx-muted" />}
                  </span>

                  <SongMenu
                    onPlayNow={() => onPlayNow(song)}
                    onPlayNext={() => onPlayNext(song)}
                    onAddToQueue={() => onAddToQueue(song)}
                    onToggleFavorite={() => onToggleFavorite(ref)}
                    isFavorite={fav}
                    onDownload={() => downloadSongs([ref])}
                    playlists={playlists}
                    onAddToPlaylist={(id) => onAddToPlaylist(id, ref)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default MainContent;
