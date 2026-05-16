import { apiFetch } from '../config';

const DB_NAME = 'onyx-audio';
const DB_VERSION = 1;
const STORE = 'tracks';
const MAX_TRACKS = 15;
const MAX_BYTES = 200 * 1024 * 1024;

let dbPromise = null;
const blobUrlByFile = new Map();

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'filename' });
        store.createIndex('cachedAt', 'cachedAt');
        store.createIndex('size', 'size');
      }
    };
  });
  return dbPromise;
}

async function withStore(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const result = fn(store);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

async function getEntry(filename) {
  return withStore('readonly', (store) => new Promise((res, rej) => {
    const r = store.get(filename);
    r.onsuccess = () => res(r.result || null);
    r.onerror = () => rej(r.error);
  }));
}

async function putEntry(filename, blob) {
  await withStore('readwrite', (store) => {
    store.put({
      filename,
      blob,
      size: blob.size,
      cachedAt: Date.now(),
    });
  });
  await evictIfNeeded();
}

async function totalCacheSize() {
  return withStore('readonly', (store) => new Promise((res, rej) => {
    let total = 0;
    const r = store.openCursor();
    r.onsuccess = (e) => {
      const cur = e.target.result;
      if (cur) {
        total += cur.value.size || 0;
        cur.continue();
      } else {
        res(total);
      }
    };
    r.onerror = () => rej(r.error);
  }));
}

async function evictIfNeeded() {
  const entries = await withStore('readonly', (store) => new Promise((res, rej) => {
    const list = [];
    const r = store.openCursor();
    r.onsuccess = (e) => {
      const cur = e.target.result;
      if (cur) {
        list.push(cur.value);
        cur.continue();
      } else {
        res(list);
      }
    };
    r.onerror = () => rej(r.error);
  }));

  let total = entries.reduce((s, e) => s + (e.size || 0), 0);
  const sorted = [...entries].sort((a, b) => a.cachedAt - b.cachedAt);

  while ((total > MAX_BYTES || sorted.length > MAX_TRACKS) && sorted.length > 0) {
    const oldest = sorted.shift();
    await withStore('readwrite', (store) => store.delete(oldest.filename));
    revokeForFile(oldest.filename);
    total -= oldest.size || 0;
  }
}

function revokeForFile(filename) {
  const url = blobUrlByFile.get(filename);
  if (url) {
    URL.revokeObjectURL(url);
    blobUrlByFile.delete(filename);
  }
}

/** URL local si la canción ya está en caché (reproducción casi instantánea). */
export async function getCachedPlaybackUrl(filename) {
  if (!filename || !('indexedDB' in window)) return null;
  try {
    const entry = await getEntry(filename);
    if (!entry?.blob) return null;
    let url = blobUrlByFile.get(filename);
    if (!url) {
      url = URL.createObjectURL(entry.blob);
      blobUrlByFile.set(filename, url);
    }
    return url;
  } catch {
    return null;
  }
}

/** Descarga y guarda la canción en segundo plano (no bloquea el play). */
export async function cacheTrackInBackground(filename) {
  if (!filename || !('indexedDB' in window)) return;
  try {
    const existing = await getEntry(filename);
    if (existing?.blob) return;

    const res = await apiFetch(`/api/stream/${encodeURIComponent(filename)}`);
    if (!res.ok) return;

    const blob = await res.blob();
    if (blob.size < 1024) return;

    await putEntry(filename, blob);
    revokeForFile(filename);
  } catch {
    /* red lenta o sin espacio */
  }
}

export function touchCachedTrack(filename) {
  if (!filename) return;
  getEntry(filename).then((entry) => {
    if (entry?.blob) putEntry(filename, entry.blob);
  }).catch(() => {});
}

export async function clearAudioCache() {
  blobUrlByFile.forEach((url) => URL.revokeObjectURL(url));
  blobUrlByFile.clear();
  if (!('indexedDB' in window)) return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
