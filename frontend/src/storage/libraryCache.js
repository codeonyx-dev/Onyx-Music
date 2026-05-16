const KEY = 'onyx_library';
const TS_KEY = 'onyx_library_ts';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const empty = () => ({ songs: [], artists: [], albums: [] });

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
    if (!data || !Array.isArray(data.songs)) return null;
    return {
      songs: data.songs,
      artists: Array.isArray(data.artists) ? data.artists : [],
      albums: Array.isArray(data.albums) ? data.albums : [],
    };
  } catch {
    return null;
  }
}

export function writeLibraryCache(library) {
  try {
    const payload = {
      songs: library.songs || [],
      artists: library.artists || [],
      albums: library.albums || [],
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
    localStorage.setItem(TS_KEY, String(Date.now()));
  } catch {
    /* quota */
  }
}

export { empty as emptyLibrary };
