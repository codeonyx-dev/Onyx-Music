/** Stable key for playlists, favorites, cache and stream URLs. */
export function songRef(song) {
  if (!song) return '';
  return song.id || song.filename || '';
}

/** Match stored ref against a song (supports legacy basename-only keys). */
export function matchesRef(stored, song) {
  if (!stored || !song) return false;
  const ref = songRef(song);
  return stored === ref || stored === song.filename;
}
