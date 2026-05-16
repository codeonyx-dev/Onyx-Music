package main

import (
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"sync"

	"github.com/dhowden/tag"
)

var (
	libraryMu    sync.RWMutex
	libraryCache []Song
	librarySig   string
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

func getCachedSongs() ([]Song, error) {
	sig, err := musicLibrarySignature()
	if err != nil {
		return nil, err
	}

	libraryMu.RLock()
	if librarySig == sig && libraryCache != nil {
		out := make([]Song, len(libraryCache))
		copy(out, libraryCache)
		libraryMu.RUnlock()
		return out, nil
	}
	libraryMu.RUnlock()

	songs, err := scanMusicLibrary()
	if err != nil {
		return nil, err
	}

	libraryMu.Lock()
	libraryCache = songs
	librarySig = sig
	out := make([]Song, len(libraryCache))
	copy(out, libraryCache)
	libraryMu.Unlock()

	return out, nil
}

func musicLibrarySignature() (string, error) {
	entries, err := os.ReadDir(musicDir)
	if err != nil {
		if os.IsNotExist(err) {
			return "empty", nil
		}
		return "", err
	}

	var parts []string
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		ext := strings.ToLower(filepath.Ext(entry.Name()))
		if !isAudioExt(ext) {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			continue
		}
		parts = append(parts, entry.Name()+":"+info.ModTime().UTC().Format(timeFormat)+":"+strconv.FormatInt(info.Size(), 10))
	}
	sort.Strings(parts)
	return strings.Join(parts, "|"), nil
}

const timeFormat = "20060102150405"

func scanMusicLibrary() ([]Song, error) {
	entries, err := os.ReadDir(musicDir)
	if err != nil {
		if os.IsNotExist(err) {
			if err := os.MkdirAll(musicDir, 0755); err != nil {
				return nil, err
			}
			return []Song{}, nil
		}
		return nil, err
	}

	dc := loadDiskCache()
	songs := make([]Song, 0, len(entries))
	var toScan []os.DirEntry

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		ext := strings.ToLower(filepath.Ext(entry.Name()))
		if !isAudioExt(ext) {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			continue
		}
		if hit, ok := diskCacheHit(dc, entry.Name(), info.Size(), info.ModTime().Unix()); ok {
			songs = append(songs, Song{
				Filename: entry.Name(),
				Title:    hit.Title,
				Artist:   hit.Artist,
				Duration: hit.Duration,
				Size:     info.Size(),
				HasCover: hit.HasCover,
			})
			continue
		}
		toScan = append(toScan, entry)
	}

	if len(toScan) > 0 {
		workers := scanWorkers()
		if workers > len(toScan) {
			workers = len(toScan)
		}
		jobs := make(chan os.DirEntry, len(toScan))
		results := make(chan Song, len(toScan))

		var wg sync.WaitGroup
		for w := 0; w < workers; w++ {
			wg.Add(1)
			go func() {
				defer wg.Done()
				for entry := range jobs {
					if song, ok := scanSongEntry(entry, dc); ok {
						results <- song
					}
				}
			}()
		}

		for _, entry := range toScan {
			jobs <- entry
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

func scanSongEntry(entry os.DirEntry, dc *diskLibraryCache) (Song, bool) {
	name := entry.Name()
	info, err := entry.Info()
	if err != nil {
		return Song{}, false
	}

	modUnix := info.ModTime().Unix()
	filePath, err := safeFilePath(name)
	if err != nil {
		return Song{}, false
	}

	fallbackTitle, fallbackArtist := parseFilename(name)
	title, artist, duration, hasCover := readSongInfo(filePath, fallbackTitle, fallbackArtist, info.Size())

	diskCacheStore(dc, name, diskSongEntry{
		Size:     info.Size(),
		ModTime:  modUnix,
		Title:    title,
		Artist:   artist,
		Duration: duration,
		HasCover: hasCover,
	})

	return Song{
		Filename: name,
		Title:    title,
		Artist:   artist,
		Duration: duration,
		Size:     info.Size(),
		HasCover: hasCover,
	}, true
}

func readSongInfo(filePath, fallbackTitle, fallbackArtist string, fileSize int64) (title, artist string, duration float64, hasCover bool) {
	title = fallbackTitle
	artist = fallbackArtist

	f, err := os.Open(filePath)
	if err != nil {
		duration = audioDuration(filePath, fileSize)
		return title, artist, duration, hasCover
	}
	defer f.Close()

	m, err := tag.ReadFrom(f)
	if err != nil {
		hasCover = sidecarCoverExists(filePath)
		duration = audioDuration(filePath, fileSize)
		return title, artist, duration, hasCover
	}

	if t := m.Title(); t != "" {
		title = t
	}
	if a := m.Artist(); a != "" {
		artist = a
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

	return title, artist, duration, hasCover
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
