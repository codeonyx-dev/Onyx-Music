const key = (username, suffix) => `onyx_${username}_${suffix}`;

export function loadPlaylists(username) {
  try {
    const raw = localStorage.getItem(key(username, 'playlists'));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePlaylists(username, playlists) {
  localStorage.setItem(key(username, 'playlists'), JSON.stringify(playlists));
}

export function loadFavorites(username) {
  try {
    const raw = localStorage.getItem(key(username, 'favorites'));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFavorites(username, favorites) {
  localStorage.setItem(key(username, 'favorites'), JSON.stringify(favorites));
}

export function createPlaylistId() {
  return `pl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
