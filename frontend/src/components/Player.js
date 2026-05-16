import React, { useState, useRef, useEffect } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music,
  Shuffle, Repeat, Repeat1, ListMusic, Waves,
} from 'lucide-react';
import AlbumArt from './AlbumArt';
import { formatTime } from '../utils/format';

function Player({
  currentSong,
  isPlaying,
  currentTime,
  duration,
  volume,
  shuffle,
  loopMode,
  crossfade,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onCycleLoop,
  onToggleCrossfade,
  onToggleQueue,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const progressRef = useRef(null);

  const displayTime = isDragging ? dragValue : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;
  const isMuted = volume === 0;
  const LoopIcon = loopMode === 'one' ? Repeat1 : Repeat;

  const seekFromEvent = (clientX) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * duration);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      if (!progressRef.current || !duration) return;
      const rect = progressRef.current.getBoundingClientRect();
      setDragValue(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration);
    };
    const onUp = () => {
      if (isDragging) onSeek(dragValue);
      setIsDragging(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, dragValue, duration, onSeek]);

  return (
    <footer className="onyx-glass border-t border-onyx-border/80 flex-shrink-0">
      <div className="px-3 sm:px-6 pt-2 flex items-center gap-2 max-w-4xl mx-auto w-full">
        <span className="text-xs text-onyx-muted w-9 text-right tabular-nums">{formatTime(displayTime)}</span>
        <div
          ref={progressRef}
          role="slider"
          aria-valuenow={displayTime}
          aria-valuemax={duration}
          onClick={(e) => seekFromEvent(e.clientX)}
          onMouseDown={() => setIsDragging(true)}
          className="flex-1 h-1.5 bg-onyx-panel rounded-full cursor-pointer relative group"
        >
          <div className="absolute inset-y-0 left-0 bg-white rounded-full" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="text-xs text-onyx-muted w-9 tabular-nums">{formatTime(duration)}</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-3 sm:px-6 py-3">
        <div className="flex items-center gap-3 min-w-0 flex-1 basis-[200px]">
          {currentSong ? (
            <>
              <AlbumArt mediaRef={currentSong.id || currentSong.filename} size="md" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentSong.title}</p>
                <p className="text-xs text-onyx-muted truncate">{currentSong.artist || 'Artista desconocido'}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-onyx-muted">Selecciona una canción</p>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 mx-auto">
          <button type="button" onClick={onToggleShuffle} className={`p-2 ${shuffle ? 'text-green-400' : 'text-onyx-muted hover:text-white'}`} title="Aleatorio">
            <Shuffle className="w-4 h-4" />
          </button>
          <button type="button" onClick={onPrevious} disabled={!currentSong} className="p-2 text-onyx-muted hover:text-white disabled:opacity-30">
            <SkipBack className="w-5 h-5" />
          </button>
          <button type="button" onClick={onPlayPause} disabled={!currentSong} className="w-11 h-11 bg-white rounded-full flex items-center justify-center disabled:opacity-30 mx-1">
            {isPlaying ? <Pause className="w-5 h-5 text-black" /> : <Play className="w-5 h-5 text-black ml-0.5" />}
          </button>
          <button type="button" onClick={onNext} disabled={!currentSong} className="p-2 text-onyx-muted hover:text-white disabled:opacity-30">
            <SkipForward className="w-5 h-5" />
          </button>
          <button type="button" onClick={onCycleLoop} className={`p-2 ${loopMode !== 'off' ? 'text-green-400' : 'text-onyx-muted hover:text-white'}`} title="Repetir">
            <LoopIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 flex-1 basis-[120px] justify-end">
          <button type="button" onClick={onToggleCrossfade} className={`p-2 hidden sm:block ${crossfade ? 'text-green-400' : 'text-onyx-muted hover:text-white'}`} title="Crossfade">
            <Waves className="w-4 h-4" />
          </button>
          <button type="button" onClick={onToggleQueue} className="p-2 text-onyx-muted hover:text-white" title="Cola">
            <ListMusic className="w-5 h-5" />
          </button>
          <button type="button" onClick={() => onVolumeChange(isMuted ? 0.8 : 0)} className="p-2 text-onyx-muted hover:text-white">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </footer>
  );
}

export default Player;
