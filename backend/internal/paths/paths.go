package paths

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"music-player-backend/internal/config"
)

// NormalizeArtist returns a display-safe artist name.
func NormalizeArtist(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "Artista desconocido"
	}
	return name
}

// NormalizeAlbum returns a display-safe album name.
func NormalizeAlbum(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "Sin álbum"
	}
	return name
}

func hashKey(parts ...string) string {
	h := sha256.New()
	for i, p := range parts {
		if i > 0 {
			h.Write([]byte{0})
		}
		h.Write([]byte(strings.ToLower(strings.TrimSpace(p))))
	}
	return hex.EncodeToString(h.Sum(nil)[:8])
}

// SongID is a stable identifier from the relative path (forward slashes).
func SongID(relPath string) string {
	return hashKey("track", NormalizeRel(relPath))
}

// ArtistID identifies an artist by display name.
func ArtistID(artist string) string {
	return hashKey("artist", artist)
}

// AlbumID identifies an album within an artist.
func AlbumID(artist, album string) string {
	return hashKey("album", artist, album)
}

func NormalizeRel(rel string) string {
	rel = filepath.ToSlash(filepath.Clean(rel))
	rel = strings.TrimPrefix(rel, "./")
	if rel == "." {
		return ""
	}
	return rel
}

// SafeMusicPath resolves a relative path under the music directory.
func SafeMusicPath(rel string) (string, error) {
	rel = NormalizeRel(rel)
	if rel == "" || strings.Contains(rel, "..") {
		return "", fmt.Errorf("ruta inválida")
	}

	absMusic, err := filepath.Abs(config.C.MusicDir)
	if err != nil {
		return "", fmt.Errorf("error de configuración")
	}

	filePath := filepath.Join(absMusic, filepath.FromSlash(rel))
	absFile, err := filepath.Abs(filePath)
	if err != nil {
		return "", fmt.Errorf("ruta inválida")
	}

	prefix := absMusic + string(os.PathSeparator)
	if !strings.HasPrefix(absFile, prefix) {
		return "", fmt.Errorf("acceso denegado")
	}

	return absFile, nil
}

// LooksLikeID reports whether s is a 16-char hex ID from SongID.
func LooksLikeID(s string) bool {
	if len(s) != 16 {
		return false
	}
	for _, c := range s {
		if (c < '0' || c > '9') && (c < 'a' || c > 'f') {
			return false
		}
	}
	return true
}
