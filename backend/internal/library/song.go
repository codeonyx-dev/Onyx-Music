package library

import (
	"music-player-backend/internal/model"
	"music-player-backend/internal/paths"
)

func finalizeSong(relPath, title, artist, album string, duration float64, size int64, hasCover bool) model.Song {
	artist = paths.NormalizeArtist(artist)
	album = paths.NormalizeAlbum(album)
	if album == paths.NormalizeAlbum("") {
		album = inferAlbumFromPath(relPath)
	}
	return model.Song{
		ID:       paths.SongID(relPath),
		Filename: relPath,
		Title:    title,
		Artist:   artist,
		ArtistID: paths.ArtistID(artist),
		Album:    album,
		AlbumID:  paths.AlbumID(artist, album),
		Duration: duration,
		Size:     size,
		HasCover: hasCover,
	}
}
