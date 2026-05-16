import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch, streamUrl, coverUrl } from '../config';

const CROSSFADE_SEC = 3;
const LIBRARY_CACHE_KEY = 'onyx_library_songs';

function readLibraryCache() {
  try {
    const raw = sessionStorage.getItem(LIBRARY_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data?.songs) ? data.songs : null;
  } catch {
    return null;
  }
}

function writeLibraryCache(songs) {
  try {
    sessionStorage.setItem(LIBRARY_CACHE_KEY, JSON.stringify({ songs, ts: Date.now() }));
  } catch {
    /* quota / private mode */
  }
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function usePlayer() {
  const [songs, setSongs] = useState([]);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shuffle, setShuffle] = useState(false);
  const [loopMode, setLoopMode] = useState('off'); // off | all | one
  const [crossfade, setCrossfade] = useState(true);

  const audioRef = useRef(new Audio());
  const nextAudioRef = useRef(new Audio());
  const queueRef = useRef(queue);
  const queueIndexRef = useRef(queueIndex);
  const songsRef = useRef(songs);
  const shuffleRef = useRef(shuffle);
  const loopRef = useRef(loopMode);
  const crossfadeRef = useRef(crossfade);
  const isTransitioningRef = useRef(false);
  const coverBlobRef = useRef(null);

  const currentSong = queue[queueIndex] || null;

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { queueIndexRef.current = queueIndex; }, [queueIndex]);
  useEffect(() => { songsRef.current = songs; }, [songs]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { loopRef.current = loopMode; }, [loopMode]);
  useEffect(() => { crossfadeRef.current = crossfade; }, [crossfade]);

  const fetchSongs = useCallback(async (options = {}) => {
    const { background = false } = options;
    const cached = readLibraryCache();

    if (cached?.length && !background) {
      setSongs(cached);
      setLoading(false);
    } else if (!background) {
      setLoading(true);
    }

    try {
      const response = await apiFetch('/api/songs');
      if (!response.ok) throw new Error('Error al obtener canciones');
      const data = await response.json();
      const list = data.songs || [];
      setSongs(list);
      writeLibraryCache(list);
      setError(null);
    } catch (err) {
      if (!cached?.length) {
        setError('No se pudo cargar la biblioteca.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = readLibraryCache();
    if (cached?.length) {
      setSongs(cached);
      setLoading(false);
      fetchSongs({ background: true });
    } else {
      fetchSongs();
    }
  }, [fetchSongs]);

  const getNextIndex = useCallback((idx, q, shuf, loop) => {
    if (q.length === 0) return -1;
    if (loop === 'one') return idx;
    if (shuf) {
      if (q.length === 1) return loop === 'all' ? 0 : -1;
      let next;
      do {
        next = Math.floor(Math.random() * q.length);
      } while (next === idx && q.length > 1);
      return next;
    }
    if (idx < q.length - 1) return idx + 1;
    if (loop === 'all') return 0;
    return -1;
  }, []);

  const fadeVolume = useCallback((audio, from, to, ms) => {
    return new Promise((resolve) => {
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / ms);
        audio.volume = from + (to - from) * t;
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }, []);

  const loadAndPlay = useCallback(async (song, useCrossfade = false) => {
    if (!song || isTransitioningRef.current) return;
    const audio = audioRef.current;
    const nextAudio = nextAudioRef.current;
    const targetVol = volume;

    const url = streamUrl(song.filename);
    const dur = song.duration > 0 ? song.duration : undefined;

    if (useCrossfade && crossfadeRef.current && audio.src && !audio.paused) {
      isTransitioningRef.current = true;
      nextAudio.src = url;
      nextAudio.load();
      nextAudio.volume = 0;

      await new Promise((resolve) => {
        const onReady = () => {
          nextAudio.removeEventListener('canplay', onReady);
          resolve();
        };
        if (nextAudio.readyState >= 2) resolve();
        else nextAudio.addEventListener('canplay', onReady);
      });

      await Promise.all([
        fadeVolume(audio, audio.volume, 0, CROSSFADE_SEC * 1000),
        (async () => {
          await nextAudio.play();
          await fadeVolume(nextAudio, 0, targetVol, CROSSFADE_SEC * 1000);
        })(),
      ]);

      audio.pause();
      audio.src = nextAudio.src;
      audio.currentTime = nextAudio.currentTime;
      audio.volume = targetVol;
      await audio.play();
      nextAudio.pause();
      nextAudio.src = '';
      isTransitioningRef.current = false;
    } else {
      audio.pause();
      audio.src = url;
      audio.load();
      audio.volume = targetVol;
      await audio.play();
    }

    if (dur) setDuration(dur);
    setIsPlaying(true);
    setError(null);
  }, [volume, fadeVolume]);

  const playAtIndex = useCallback((index, withCrossfade = false) => {
    const q = queueRef.current;
    if (index < 0 || index >= q.length) return;
    setQueueIndex(index);
    queueIndexRef.current = index;
    loadAndPlay(q[index], withCrossfade);
  }, [loadAndPlay]);

  const advance = useCallback((withCrossfade = true) => {
    const idx = queueIndexRef.current;
    const q = queueRef.current;
    const next = getNextIndex(idx, q, shuffleRef.current, loopRef.current);
    if (next < 0) {
      setIsPlaying(false);
      return;
    }
    playAtIndex(next, withCrossfade);
  }, [getNextIndex, playAtIndex]);

  const playNow = useCallback((song) => {
    const all = songsRef.current;
    const rest = shuffleRef.current
      ? shuffleArray(all.filter((s) => s.filename !== song.filename))
      : all.filter((s) => s.filename !== song.filename);
    const newQueue = [song, ...rest];
    setQueue(newQueue);
    queueRef.current = newQueue;
    setQueueIndex(0);
    queueIndexRef.current = 0;
    loadAndPlay(song, false);
  }, [loadAndPlay]);

  const playNext = useCallback((song) => {
    setQueue((prev) => {
      const idx = queueIndexRef.current;
      const next = [...prev];
      next.splice(idx + 1, 0, song);
      queueRef.current = next;
      return next;
    });
  }, []);

  const addToQueue = useCallback((song) => {
    setQueue((prev) => {
      const next = [...prev, song];
      queueRef.current = next;
      return next;
    });
  }, []);

  const removeFromQueue = useCallback((index) => {
    setQueue((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      const next = prev.filter((_, i) => i !== index);
      queueRef.current = next;
      const cur = queueIndexRef.current;
      if (index < cur) setQueueIndex(cur - 1);
      else if (index === cur && next.length === 0) {
        setQueueIndex(0);
        audioRef.current.pause();
        setIsPlaying(false);
      } else if (index === cur) playAtIndex(Math.min(cur, next.length - 1), false);
      return next;
    });
  }, [playAtIndex]);

  const reorderQueue = useCallback((from, to) => {
    setQueue((prev) => {
      if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      queueRef.current = next;

      const cur = queueIndexRef.current;
      let newCur = cur;
      if (from === cur) newCur = to;
      else if (from < cur && to >= cur) newCur = cur - 1;
      else if (from > cur && to <= cur) newCur = cur + 1;

      setQueueIndex(newCur);
      queueIndexRef.current = newCur;
      return next;
    });
  }, []);

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else if (currentSong) {
      audio.play().catch(console.error);
    } else if (queue.length > 0) {
      playAtIndex(0, false);
    } else if (songs.length > 0) {
      playNow(songs[0]);
    }
  }, [isPlaying, currentSong, queue.length, songs, playAtIndex, playNow]);

  const handlePrevious = useCallback(() => {
    const audio = audioRef.current;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    const idx = queueIndexRef.current;
    const q = queueRef.current;
    if (idx > 0) playAtIndex(idx - 1, crossfadeRef.current);
    else if (loopRef.current === 'all' && q.length > 0) playAtIndex(q.length - 1, crossfadeRef.current);
  }, [playAtIndex]);

  const handleSeek = useCallback((time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const cycleLoop = useCallback(() => {
    setLoopMode((m) => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (!Number.isNaN(audio.duration) && audio.duration > 0) {
        setDuration((d) => (d > 0 ? d : audio.duration));
      }
    };
    const onLoadedMetadata = () => {
      if (!Number.isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onEnded = () => {
      if (loopRef.current === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.error);
        return;
      }
      advance(true);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => {
      setError('Error al reproducir el audio');
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
    };
  }, [advance]);

  useEffect(() => {
    audioRef.current.volume = volume;
    if (!isTransitioningRef.current) nextAudioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!currentSong || !('mediaSession' in navigator)) return;

    const updateArtwork = async () => {
      if (coverBlobRef.current) URL.revokeObjectURL(coverBlobRef.current);
      coverBlobRef.current = null;
      let artwork = [];
      try {
        const res = await apiFetch(`/api/cover/${encodeURIComponent(currentSong.filename)}`);
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          coverBlobRef.current = url;
          artwork = [{ src: url, sizes: '512x512', type: blob.type || 'image/jpeg' }];
        }
      } catch {
        /* sin carátula */
      }

      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist || 'Artista desconocido',
        album: 'Onyx Music Player',
        artwork,
      });
    };

    updateArtwork();

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    navigator.mediaSession.setActionHandler('play', () => {
      audioRef.current.play().catch(console.error);
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      audioRef.current.pause();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => handlePrevious());
    navigator.mediaSession.setActionHandler('nexttrack', () => advance(true));

    return () => {
      if (coverBlobRef.current) URL.revokeObjectURL(coverBlobRef.current);
    };
  }, [currentSong, isPlaying, handlePlayPause, handlePrevious, advance]);

  return {
    songs,
    queue,
    queueIndex,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    loading,
    error,
    shuffle,
    loopMode,
    crossfade,
    setShuffle,
    setCrossfade,
    cycleLoop,
    setVolume,
    fetchSongs,
    playNow,
    playNext,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    handlePlayPause,
    handlePrevious,
    advance: () => advance(true),
    handleSeek,
    playAtIndex,
  };
}
