export const CROSSFADE_SEC = 1.5;

export function initAudioElement() {
  const audio = new Audio();
  audio.preload = 'auto';
  return audio;
}

export function waitAudioReady(audio, timeoutMs = 5000) {
  if (audio.readyState >= 2) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      audio.removeEventListener('loadeddata', done);
      audio.removeEventListener('error', done);
      resolve();
    };
    const timer = setTimeout(done, timeoutMs);
    audio.addEventListener('loadeddata', done, { once: true });
    audio.addEventListener('error', done, { once: true });
  });
}

export async function safePlay(audio) {
  try {
    await audio.play();
    return true;
  } catch (err) {
    if (err?.name === 'AbortError') return false;
    throw err;
  }
}

export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function fadeVolume(audio, from, to, ms) {
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
}
