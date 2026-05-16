package library

import (
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/dhowden/tag"
	"music-player-backend/internal/paths"
)

func durationFromTags(m tag.Metadata) float64 {
	raw := m.Raw()
	if raw == nil {
		return 0
	}

	keys := []string{"Length", "TLEN", "length", "DURATION"}
	for _, key := range keys {
		v, ok := raw[key]
		if !ok {
			continue
		}
		switch t := v.(type) {
		case string:
			s := strings.TrimSpace(t)
			if s == "" {
				continue
			}
			if ms, err := strconv.ParseFloat(s, 64); err == nil && ms > 0 {
				if strings.EqualFold(key, "TLEN") || ms > 10000 {
					return ms / 1000
				}
				return ms
			}
		case int:
			if t > 0 {
				return float64(t)
			}
		case int64:
			if t > 0 {
				return float64(t)
			}
		case float64:
			if t > 0 {
				return t
			}
		}
	}
	return 0
}

func readSongInfo(filePath, relPath, fallbackTitle, fallbackArtist, fallbackAlbum string, fileSize int64) (title, artist, album string, duration float64, hasCover bool) {
	title = fallbackTitle
	artist = fallbackArtist
	album = fallbackAlbum

	f, err := os.Open(filePath)
	if err != nil {
		duration = audioDuration(filePath, fileSize)
		return title, artist, album, duration, hasCover
	}
	defer f.Close()

	m, err := tag.ReadFrom(f)
	if err != nil {
		hasCover = sidecarCoverExists(filePath)
		duration = audioDuration(filePath, fileSize)
		return title, artist, album, duration, hasCover
	}

	if t := m.Title(); t != "" {
		title = t
	}
	if a := m.Artist(); a != "" {
		artist = a
	}
	if al := m.Album(); al != "" {
		album = al
	}

	pic := m.Picture()
	if pic != nil && len(pic.Data) > 0 {
		hasCover = true
	}

	duration = durationFromTags(m)
	if duration <= 0 {
		duration = audioDuration(filePath, fileSize)
	}
	if !hasCover {
		hasCover = sidecarCoverExists(filePath)
	}
	if album == "" {
		album = inferAlbumFromPath(relPath)
	}
	return title, artist, album, duration, hasCover
}

func inferAlbumFromPath(relPath string) string {
	parts := strings.Split(paths.NormalizeRel(relPath), "/")
	if len(parts) >= 3 {
		return paths.NormalizeAlbum(parts[len(parts)-2])
	}
	return paths.NormalizeAlbum("")
}

func sidecarCoverExists(audioPath string) bool {
	base := strings.TrimSuffix(audioPath, filepath.Ext(audioPath))
	for _, ext := range []string{".jpg", ".jpeg", ".png", ".webp"} {
		if _, err := os.Stat(base + ext); err == nil {
			return true
		}
	}
	return false
}

func parseFilename(relPath string) (title, artist string) {
	name := filepath.Base(relPath)
	name = strings.TrimSuffix(name, filepath.Ext(name))
	name = strings.ReplaceAll(name, "_", " ")

	if idx := strings.Index(name, " - "); idx > 0 {
		artist = strings.TrimSpace(name[:idx])
		title = strings.TrimSpace(name[idx+3:])
		return title, artist
	}
	return cleanTitle(name), ""
}

func cleanTitle(name string) string {
	name = strings.ReplaceAll(name, "-", " ")
	for strings.Contains(name, "  ") {
		name = strings.ReplaceAll(name, "  ", " ")
	}
	return strings.TrimSpace(name)
}

func isAudioExt(ext string) bool {
	switch ext {
	case ".mp3", ".wav", ".ogg", ".flac", ".m4a", ".aac":
		return true
	default:
		return false
	}
}

func shouldSkipDir(name string) bool {
	return strings.HasPrefix(name, ".") || name == "@eaDir"
}

type audioFile struct {
	relPath string
	size    int64
	modUnix int64
}

func collectAudioFiles(root string) ([]audioFile, error) {
	absRoot, err := filepath.Abs(root)
	if err != nil {
		return nil, err
	}

	var files []audioFile
	err = filepath.WalkDir(absRoot, func(path string, d os.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		if d.IsDir() {
			if path != absRoot && shouldSkipDir(d.Name()) {
				return filepath.SkipDir
			}
			return nil
		}
		if strings.HasPrefix(d.Name(), ".") {
			return nil
		}
		ext := strings.ToLower(filepath.Ext(d.Name()))
		if !isAudioExt(ext) {
			return nil
		}
		info, err := d.Info()
		if err != nil {
			return nil
		}
		rel, err := filepath.Rel(absRoot, path)
		if err != nil {
			return nil
		}
		files = append(files, audioFile{
			relPath: paths.NormalizeRel(rel),
			size:    info.Size(),
			modUnix: info.ModTime().Unix(),
		})
		return nil
	})
	return files, err
}
