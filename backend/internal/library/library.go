package library

import (
	"os"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"sync"

	"music-player-backend/internal/config"
	"music-player-backend/internal/model"
	"music-player-backend/internal/paths"
	"music-player-backend/internal/store"
)

var (
	libraryMu      sync.RWMutex
	libraryBundle  model.Library
	librarySig     string
	idToPath       map[string]string
)

func scanWorkers() int {
	n := runtime.NumCPU() * 2
	if n < 8 {
		return 8
	}
	if n > 32 {
		return 32
	}
	return n
}

func rebuildIDIndex(songs []model.Song) {
	idx := make(map[string]string, len(songs))
	for _, s := range songs {
		idx[s.ID] = s.Filename
	}
	idToPath = idx
}

func setBundle(lib model.Library, sig string) {
	libraryBundle = lib
	librarySig = sig
	rebuildIDIndex(lib.Songs)
}

// ResolveRef maps a stream/cover ref (ID or relative path) to an absolute file path.
func ResolveRef(ref string) (string, error) {
	ref = strings.TrimSpace(ref)
	if ref == "" {
		return "", errInvalidRef
	}
	if paths.LooksLikeID(ref) {
		libraryMu.RLock()
		rel, ok := idToPath[ref]
		libraryMu.RUnlock()
		if !ok {
			return "", errNotFound
		}
		return paths.SafeMusicPath(rel)
	}
	return paths.SafeMusicPath(ref)
}

var (
	errInvalidRef = &resolveError{msg: "referencia inválida"}
	errNotFound   = &resolveError{msg: "pista no encontrada"}
)

type resolveError struct{ msg string }

func (e *resolveError) Error() string { return e.msg }

func GetLibrary() (model.Library, error) {
	sig, err := musicLibrarySignature()
	if err != nil {
		return model.Library{}, err
	}

	libraryMu.RLock()
	if librarySig == sig {
		out := libraryBundle
		libraryMu.RUnlock()
		return out, nil
	}
	libraryMu.RUnlock()

	storedSig, _ := store.GetSignature()
	if storedSig == sig && storedSig != "" {
		if lib, err := store.LoadLibrary(); err == nil {
			libraryMu.Lock()
			setBundle(lib, sig)
			libraryMu.Unlock()
			return lib, nil
		}
	}

	lib, err := scanAndPersist(sig)
	if err != nil {
		return model.Library{}, err
	}
	return lib, nil
}

func GetSongs() ([]model.Song, error) {
	lib, err := GetLibrary()
	return lib.Songs, err
}

func scanAndPersist(sig string) (model.Library, error) {
	songs, err := scanMusicLibrary()
	if err != nil {
		return model.Library{}, err
	}
	if err := store.SyncLibrary(songs, sig); err != nil {
		return model.Library{}, err
	}
	lib, err := store.LoadLibrary()
	if err != nil {
		lib = model.Library{Songs: songs, Artists: store.BuildArtists(songs), Albums: store.BuildAlbums(songs)}
	}
	libraryMu.Lock()
	setBundle(lib, sig)
	libraryMu.Unlock()
	return lib, nil
}

func InvalidateCache() {
	libraryMu.Lock()
	libraryBundle = model.Library{}
	librarySig = ""
	idToPath = nil
	libraryMu.Unlock()
}

func musicLibrarySignature() (string, error) {
	files, err := collectAudioFiles(config.C.MusicDir)
	if err != nil {
		if os.IsNotExist(err) {
			return "empty", nil
		}
		return "", err
	}

	parts := make([]string, 0, len(files))
	for _, f := range files {
		parts = append(parts, f.relPath+":"+strconv.FormatInt(f.modUnix, 10)+":"+strconv.FormatInt(f.size, 10))
	}
	sort.Strings(parts)
	return strings.Join(parts, "|"), nil
}

func scanMusicLibrary() ([]model.Song, error) {
	root := config.C.MusicDir
	if _, err := os.Stat(root); os.IsNotExist(err) {
		if err := os.MkdirAll(root, 0755); err != nil {
			return nil, err
		}
		return []model.Song{}, nil
	}

	files, err := collectAudioFiles(root)
	if err != nil {
		return nil, err
	}

	dc := loadDiskCache()
	songs := make([]model.Song, 0, len(files))
	var toScan []audioFile

	for _, f := range files {
		if hit, ok := diskCacheHit(dc, f.relPath, f.size, f.modUnix); ok {
			songs = append(songs, finalizeSong(
				f.relPath, hit.Title, hit.Artist, hit.Album, hit.Duration, f.size, hit.HasCover,
			))
			continue
		}
		toScan = append(toScan, f)
	}

	if len(toScan) > 0 {
		workers := scanWorkers()
		if workers > len(toScan) {
			workers = len(toScan)
		}
		jobs := make(chan audioFile, len(toScan))
		results := make(chan model.Song, len(toScan))

		var wg sync.WaitGroup
		for w := 0; w < workers; w++ {
			wg.Add(1)
			go func() {
				defer wg.Done()
				for f := range jobs {
					if song, ok := scanAudioFile(f, dc); ok {
						results <- song
					}
				}
			}()
		}

		for _, f := range toScan {
			jobs <- f
		}
		close(jobs)
		wg.Wait()
		close(results)

		for song := range results {
			songs = append(songs, song)
		}
	}

	sort.Slice(songs, func(i, j int) bool {
		return strings.ToLower(songs[i].Title) < strings.ToLower(songs[j].Title)
	})

	saveDiskCache(dc)
	return songs, nil
}

func scanAudioFile(f audioFile, dc *diskLibraryCache) (model.Song, bool) {
	filePath, err := paths.SafeMusicPath(f.relPath)
	if err != nil {
		return model.Song{}, false
	}

	fallbackTitle, fallbackArtist := parseFilename(f.relPath)
	fallbackAlbum := inferAlbumFromPath(f.relPath)
	title, artist, album, duration, hasCover := readSongInfo(
		filePath, f.relPath, fallbackTitle, fallbackArtist, fallbackAlbum, f.size,
	)

	diskCacheStore(dc, f.relPath, diskSongEntry{
		Size:     f.size,
		ModTime:  f.modUnix,
		Title:    title,
		Artist:   artist,
		Album:    album,
		Duration: duration,
		HasCover: hasCover,
	})

	return finalizeSong(f.relPath, title, artist, album, duration, f.size, hasCover), true
}
