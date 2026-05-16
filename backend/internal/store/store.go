package store

import (
	"database/sql"
	"os"
	"path/filepath"
	"sync"

	"music-player-backend/internal/config"
	"music-player-backend/internal/model"

	_ "modernc.org/sqlite"
)

const metaSignature = "library_signature"

var (
	openOnce sync.Once
	db       *sql.DB
	openErr  error
)

func DB() (*sql.DB, error) {
	openOnce.Do(func() {
		path := dbPath()
		if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
			openErr = err
			return
		}
		db, openErr = sql.Open("sqlite", path+"?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)")
		if openErr != nil {
			return
		}
		db.SetMaxOpenConns(1)
		openErr = migrate(db)
	})
	return db, openErr
}

func dbPath() string {
	dir := config.C.CacheDir
	if dir == "" {
		dir = filepath.Join(os.TempDir(), "onyx-music-cache")
	}
	return filepath.Join(dir, "library.db")
}

func migrate(db *sql.DB) error {
	_, err := db.Exec(`
CREATE TABLE IF NOT EXISTS library_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tracks (
  id TEXT PRIMARY KEY,
  rel_path TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  artist_id TEXT NOT NULL,
  album TEXT NOT NULL,
  album_id TEXT NOT NULL,
  duration REAL NOT NULL DEFAULT 0,
  size INTEGER NOT NULL DEFAULT 0,
  has_cover INTEGER NOT NULL DEFAULT 0,
  mod_time INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_tracks_artist_id ON tracks(artist_id);
CREATE INDEX IF NOT EXISTS idx_tracks_album_id ON tracks(album_id);
`)
	return err
}

func GetSignature() (string, error) {
	conn, err := DB()
	if err != nil {
		return "", err
	}
	var sig string
	err = conn.QueryRow(`SELECT value FROM library_meta WHERE key = ?`, metaSignature).Scan(&sig)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return sig, err
}

func SetSignature(sig string) error {
	conn, err := DB()
	if err != nil {
		return err
	}
	_, err = conn.Exec(
		`INSERT INTO library_meta(key, value) VALUES(?, ?)
		 ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
		metaSignature, sig,
	)
	return err
}

func SyncLibrary(songs []model.Song, signature string) error {
	conn, err := DB()
	if err != nil {
		return err
	}

	tx, err := conn.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`DELETE FROM tracks`); err != nil {
		return err
	}

	stmt, err := tx.Prepare(`
INSERT INTO tracks(id, rel_path, title, artist, artist_id, album, album_id, duration, size, has_cover, mod_time)
VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, s := range songs {
		cover := 0
		if s.HasCover {
			cover = 1
		}
		if _, err := stmt.Exec(
			s.ID, s.Filename, s.Title, s.Artist, s.ArtistID, s.Album, s.AlbumID,
			s.Duration, s.Size, cover,
		); err != nil {
			return err
		}
	}

	if _, err := tx.Exec(
		`INSERT INTO library_meta(key, value) VALUES(?, ?)
		 ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
		metaSignature, signature,
	); err != nil {
		return err
	}

	return tx.Commit()
}

func LoadLibrary() (model.Library, error) {
	conn, err := DB()
	if err != nil {
		return model.Library{}, err
	}

	rows, err := conn.Query(`
SELECT id, rel_path, title, artist, artist_id, album, album_id, duration, size, has_cover
FROM tracks
ORDER BY lower(title)`)
	if err != nil {
		return model.Library{}, err
	}
	defer rows.Close()

	var songs []model.Song
	for rows.Next() {
		var s model.Song
		var cover int
		if err := rows.Scan(
			&s.ID, &s.Filename, &s.Title, &s.Artist, &s.ArtistID, &s.Album, &s.AlbumID,
			&s.Duration, &s.Size, &cover,
		); err != nil {
			return model.Library{}, err
		}
		s.HasCover = cover == 1
		songs = append(songs, s)
	}
	if err := rows.Err(); err != nil {
		return model.Library{}, err
	}

	return model.Library{
		Songs:   songs,
		Artists: buildArtists(songs),
		Albums:  buildAlbums(songs),
	}, nil
}

func BuildArtists(songs []model.Song) []model.Artist {
	return buildArtists(songs)
}

func BuildAlbums(songs []model.Song) []model.Album {
	return buildAlbums(songs)
}

func buildArtists(songs []model.Song) []model.Artist {
	type agg struct {
		name   string
		songs  int
		albums map[string]struct{}
	}
	byID := map[string]*agg{}

	for _, s := range songs {
		a, ok := byID[s.ArtistID]
		if !ok {
			a = &agg{name: s.Artist, albums: map[string]struct{}{}}
			byID[s.ArtistID] = a
		}
		a.songs++
		a.albums[s.AlbumID] = struct{}{}
	}

	out := make([]model.Artist, 0, len(byID))
	for id, a := range byID {
		out = append(out, model.Artist{
			ID:         id,
			Name:       a.name,
			SongCount:  a.songs,
			AlbumCount: len(a.albums),
		})
	}
	sortArtists(out)
	return out
}

func buildAlbums(songs []model.Song) []model.Album {
	type agg struct {
		name     string
		artist   string
		artistID string
		songs    int
	}
	byID := map[string]*agg{}

	for _, s := range songs {
		a, ok := byID[s.AlbumID]
		if !ok {
			a = &agg{name: s.Album, artist: s.Artist, artistID: s.ArtistID}
			byID[s.AlbumID] = a
		}
		a.songs++
	}

	out := make([]model.Album, 0, len(byID))
	for id, a := range byID {
		out = append(out, model.Album{
			ID:        id,
			Name:      a.name,
			ArtistID:  a.artistID,
			Artist:    a.artist,
			SongCount: a.songs,
		})
	}
	sortAlbums(out)
	return out
}
