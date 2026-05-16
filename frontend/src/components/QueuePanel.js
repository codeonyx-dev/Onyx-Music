import React, { useState } from 'react';
import { ListMusic, X, GripVertical, Trash2 } from 'lucide-react';
import AlbumArt from './AlbumArt';
import { formatTime } from '../utils/format';

function QueuePanel({
  open,
  onClose,
  queue,
  queueIndex,
  onPlayAtIndex,
  onRemove,
  onReorder,
}) {
  const [dragIndex, setDragIndex] = useState(null);

  if (!open) return null;

  const handleDragStart = (index) => setDragIndex(index);
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    onReorder(dragIndex, index);
    setDragIndex(index);
  };
  const handleDragEnd = () => setDragIndex(null);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onClose} aria-hidden />
      <aside className="fixed right-0 top-0 bottom-0 w-full max-w-sm onyx-glass border-l border-onyx-border/80 z-50 flex flex-col shadow-2xl lg:static lg:max-w-xs lg:shadow-none lg:z-0 lg:flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-4 border-b border-onyx-border">
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-white" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Cola</h2>
            <span className="text-xs text-onyx-muted">({queue.length})</span>
          </div>
          <button onClick={onClose} className="text-onyx-muted hover:text-white p-1 lg:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {queue.length === 0 ? (
            <p className="text-sm text-onyx-muted text-center py-12 px-4">La cola está vacía</p>
          ) : (
            <ul className="divide-y divide-onyx-border">
              {queue.map((song, index) => (
                <li
                  key={`${song.filename}-${index}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 px-3 py-2.5 group ${
                    index === queueIndex ? 'bg-onyx-hover' : 'hover:bg-onyx-hover/50'
                  }`}
                >
                  <GripVertical className="w-4 h-4 text-onyx-muted flex-shrink-0 cursor-grab opacity-50 group-hover:opacity-100" />
                  <button
                    type="button"
                    onClick={() => onPlayAtIndex(index)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    <AlbumArt filename={song.filename} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm truncate ${index === queueIndex ? 'text-white font-medium' : 'text-onyx-text'}`}>
                        {song.title}
                      </p>
                      <p className="text-xs text-onyx-muted truncate">
                        {song.artist || 'Artista desconocido'}
                        {song.duration > 0 && ` · ${formatTime(song.duration)}`}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(index)}
                    className="p-1.5 text-onyx-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Quitar de la cola"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}

export default QueuePanel;
