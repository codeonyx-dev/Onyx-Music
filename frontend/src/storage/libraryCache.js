const KEY = 'onyx_library_songs';
const TS_KEY = 'onyx_library_ts';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function readLibraryCache() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const ts = Number(localStorage.getItem(TS_KEY) || 0);
    if (Date.now() - ts > MAX_AGE_MS) {
      localStorage.removeItem(KEY);
      localStorage.removeItem(TS_KEY);
      return null;
    }
    const data = JSON.parse(raw);
    return Array.isArray(data?.songs) ? data.songs : null;
  } catch {
    return null;
  }
}

export function writeLibraryCache(songs) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ songs }));
    localStorage.setItem(TS_KEY, String(Date.now()));
  } catch {
    /* quota */
  }
}
