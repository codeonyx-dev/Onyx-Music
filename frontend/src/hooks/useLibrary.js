import { useState, useCallback, useEffect } from 'react';
import {
  loadPlaylists,
  savePlaylists,
  loadFavorites,
  saveFavorites,
  createPlaylistId,
} from '../storage/userLibrary';
import { songRef, matchesRef } from '../utils/songKey';

export function useLibrary(username) {
  const [view, setView] = useState({ type: 'library' });
  const [playlists, setPlaylists] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => {
    if (!username) return;
    setPlaylists(loadPlaylists(username));
    setFavorites(loadFavorites(username));
    setSelected(new Set());
  }, [username]);

  const persistPlaylists = useCallback(
    (next) => {
      setPlaylists(next);
      if (username) savePlaylists(username, next);
    },
    [username]
  );

  const persistFavorites = useCallback(
    (next) => {
      setFavorites(next);
      if (username) saveFavorites(username, next);
    },
    [username]
  );

  const createPlaylist = useCallback(
    (name) => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const pl = { id: createPlaylistId(), name: trimmed, songs: [] };
      persistPlaylists([...playlists, pl]);
      setView({ type: 'playlist', id: pl.id });
      return pl;
    },
    [playlists, persistPlaylists]
  );

  const deletePlaylist = useCallback(
    (id) => {
      persistPlaylists(playlists.filter((p) => p.id !== id));
      if (view.type === 'playlist' && view.id === id) {
        setView({ type: 'library' });
      }
    },
    [playlists, persistPlaylists, view]
  );

  const addSongsToPlaylist = useCallback(
    (playlistId, filenames) => {
      const list = Array.isArray(filenames) ? filenames : [filenames];
      persistPlaylists(
        playlists.map((p) => {
          if (p.id !== playlistId) return p;
          const merged = [...p.songs];
          list.forEach((f) => {
            if (!merged.includes(f)) merged.push(f);
          });
          return { ...p, songs: merged };
        })
      );
    },
    [playlists, persistPlaylists]
  );

  const removeSongFromPlaylist = useCallback(
    (playlistId, filename) => {
      persistPlaylists(
        playlists.map((p) =>
          p.id === playlistId ? { ...p, songs: p.songs.filter((f) => f !== filename) } : p
        )
      );
    },
    [playlists, persistPlaylists]
  );

  const toggleFavorite = useCallback(
    (songOrRef) => {
      const ref = typeof songOrRef === 'string' ? songOrRef : songRef(songOrRef);
      const isFav =
        typeof songOrRef === 'string'
          ? favorites.includes(ref)
          : favorites.some((f) => matchesRef(f, songOrRef));
      const next = isFav
        ? favorites.filter((f) =>
            typeof songOrRef === 'string' ? f !== ref : !matchesRef(f, songOrRef)
          )
        : [...favorites, ref];
      persistFavorites(next);
    },
    [favorites, persistFavorites]
  );

  const isFavorite = useCallback(
    (song) => favorites.some((f) => matchesRef(f, song)),
    [favorites]
  );

  const toggleSelect = useCallback((filename) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) next.delete(filename);
      else next.add(filename);
      return next;
    });
  }, []);

  const selectAll = useCallback((filenames) => {
    setSelected(new Set(filenames));
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const getViewTitle = useCallback(
    (artists = [], albums = []) => {
      if (view.type === 'library') return 'Tu Biblioteca';
      if (view.type === 'favorites') return 'Favoritos';
      if (view.type === 'artists') return 'Artistas';
      if (view.type === 'artist') {
        const a = artists.find((x) => x.id === view.id);
        return a ? a.name : 'Artista';
      }
      if (view.type === 'album') {
        const al = albums.find((x) => x.id === view.id);
        return al ? al.name : 'Álbum';
      }
      if (view.type === 'playlist') {
        const pl = playlists.find((p) => p.id === view.id);
        return pl ? pl.name : 'Lista';
      }
      return 'Biblioteca';
    },
    [view, playlists]
  );

  const filterSongs = useCallback(
    (allSongs) => {
      if (view.type === 'library') return allSongs;
      if (view.type === 'favorites') {
        return allSongs.filter((s) => favorites.some((f) => matchesRef(f, s)));
      }
      if (view.type === 'artist') {
        return allSongs.filter((s) => s.artist_id === view.id);
      }
      if (view.type === 'album') {
        return allSongs.filter((s) => s.album_id === view.id);
      }
      if (view.type === 'playlist') {
        const pl = playlists.find((p) => p.id === view.id);
        if (!pl) return [];
        return pl.songs
          .map((f) => allSongs.find((s) => matchesRef(f, s)))
          .filter(Boolean);
      }
      return allSongs;
    },
    [view, favorites, playlists]
  );

  const albumsForArtist = useCallback(
    (artistId, allAlbums) => allAlbums.filter((a) => a.artist_id === artistId),
    []
  );

  return {
    view,
    setView,
    playlists,
    favorites,
    selected,
    createPlaylist,
    deletePlaylist,
    addSongsToPlaylist,
    removeSongFromPlaylist,
    toggleFavorite,
    isFavorite,
    toggleSelect,
    selectAll,
    clearSelection,
    getViewTitle,
    filterSongs,
    albumsForArtist,
    songRef,
  };
}
