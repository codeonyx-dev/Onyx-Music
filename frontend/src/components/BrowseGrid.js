import React from 'react';
import { Disc3, User, Play } from 'lucide-react';

function BrowseGrid({ mode, items, onSelect, onPlayAll }) {
  if (!items?.length) {
    return (
      <p className="text-sm text-onyx-muted text-center py-16">
        {mode === 'artists' ? 'No hay artistas en la biblioteca.' : 'No hay álbumes.'}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="onyx-glass-panel border border-onyx-border/80 p-4 flex flex-col gap-2 hover:bg-onyx-hover/40 transition-colors group"
        >
          <button
            type="button"
            onClick={() => onSelect(item)}
            className="flex flex-col items-center text-center gap-2 flex-1 min-w-0"
          >
            <div className="w-16 h-16 rounded-full bg-onyx-panel border border-onyx-border flex items-center justify-center flex-shrink-0">
              {mode === 'artists' ? (
                <User className="w-8 h-8 text-onyx-muted" />
              ) : (
                <Disc3 className="w-8 h-8 text-onyx-muted" />
              )}
            </div>
            <p className="text-sm font-medium text-white truncate w-full">{item.name}</p>
            {mode === 'albums' && (
              <p className="text-xs text-onyx-muted truncate w-full">{item.artist}</p>
            )}
            <p className="text-xs text-onyx-muted">
              {mode === 'artists'
                ? `${item.album_count} álbum${item.album_count !== 1 ? 'es' : ''} · ${item.song_count} pistas`
                : `${item.song_count} pista${item.song_count !== 1 ? 's' : ''}`}
            </p>
          </button>
          {onPlayAll && (
            <button
              type="button"
              onClick={() => onPlayAll(item)}
              className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-onyx-muted hover:text-white border border-onyx-border hover:border-white/30 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Play className="w-3.5 h-3.5" />
              Reproducir
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default BrowseGrid;
