export function sortSongs(songs, sortBy, sortDir) {
  const dir = sortDir === 'asc' ? 1 : -1;
  return [...songs].sort((a, b) => {
    const va = (sortBy === 'artist' ? a.artist : a.title) || '';
    const vb = (sortBy === 'artist' ? b.artist : b.title) || '';
    return va.localeCompare(vb, 'es', { sensitivity: 'base' }) * dir;
  });
}
