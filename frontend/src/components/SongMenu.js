import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Play, ListPlus, ListEnd, Heart, Download, ListMusic } from 'lucide-react';

function SongMenu({
  onPlayNow,
  onPlayNext,
  onAddToQueue,
  onToggleFavorite,
  isFavorite,
  onDownload,
  playlists,
  onAddToPlaylist,
}) {
  const [open, setOpen] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setShowPlaylists(false);
      }
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  const item = (onClick, icon, label) => (
    <button
      type="button"
      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-onyx-hover text-left"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
        setOpen(false);
        setShowPlaylists(false);
      }}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="p-1.5 text-onyx-muted hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 min-w-[200px] bg-onyx-panel border border-onyx-border shadow-xl py-1">
          {item(onPlayNow, <Play className="w-4 h-4" />, 'Reproducir')}
          {item(onPlayNext, <ListPlus className="w-4 h-4" />, 'Reproducir siguiente')}
          {item(onAddToQueue, <ListEnd className="w-4 h-4" />, 'Añadir a la cola')}
          {item(
            onToggleFavorite,
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-400 text-red-400' : ''}`} />,
            isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'
          )}
          {item(onDownload, <Download className="w-4 h-4" />, 'Descargar')}
          <div className="border-t border-onyx-border my-1" />
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-onyx-hover text-left"
            onClick={(e) => {
              e.stopPropagation();
              setShowPlaylists((s) => !s);
            }}
          >
            <ListMusic className="w-4 h-4" />
            Añadir a lista
          </button>
          {showPlaylists && (
            <div className="max-h-40 overflow-y-auto border-t border-onyx-border">
              {playlists.length === 0 ? (
                <p className="px-3 py-2 text-xs text-onyx-muted">Crea una lista en el menú lateral</p>
              ) : (
                playlists.map((pl) =>
                  item(
                    () => onAddToPlaylist(pl.id),
                    <ListMusic className="w-3.5 h-3.5" />,
                    pl.name
                  )
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SongMenu;
