package main

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
)

type diskSongEntry struct {
	Size     int64   `json:"size"`
	ModTime  int64   `json:"mod_time"`
	Title    string  `json:"title"`
	Artist   string  `json:"artist"`
	Duration float64 `json:"duration"`
	HasCover bool    `json:"has_cover"`
}

type diskLibraryCache struct {
	Version int                        `json:"version"`
	Songs   map[string]diskSongEntry   `json:"songs"`
}

const diskCacheVersion = 1

var (
	diskCacheMu sync.Mutex
	diskCache   *diskLibraryCache
)

func cacheFilePath() string {
	dir := cfg.CacheDir
	if dir == "" {
		dir = filepath.Join(os.TempDir(), "onyx-music-cache")
	}
	_ = os.MkdirAll(dir, 0755)
	return filepath.Join(dir, "library.json")
}

func loadDiskCache() *diskLibraryCache {
	diskCacheMu.Lock()
	defer diskCacheMu.Unlock()

	if diskCache != nil {
		return diskCache
	}

	path := cacheFilePath()
	data, err := os.ReadFile(path)
	if err != nil {
		diskCache = &diskLibraryCache{Version: diskCacheVersion, Songs: map[string]diskSongEntry{}}
		return diskCache
	}

	var loaded diskLibraryCache
	if err := json.Unmarshal(data, &loaded); err != nil || loaded.Songs == nil {
		diskCache = &diskLibraryCache{Version: diskCacheVersion, Songs: map[string]diskSongEntry{}}
		return diskCache
	}
	if loaded.Version != diskCacheVersion {
		diskCache = &diskLibraryCache{Version: diskCacheVersion, Songs: map[string]diskSongEntry{}}
		return diskCache
	}

	diskCache = &loaded
	return diskCache
}

func saveDiskCache(dc *diskLibraryCache) {
	if dc == nil {
		return
	}
	data, err := json.Marshal(dc)
	if err != nil {
		return
	}
	path := cacheFilePath()
	_ = os.WriteFile(path, data, 0644)
}

func diskCacheHit(dc *diskLibraryCache, filename string, size, modUnix int64) (diskSongEntry, bool) {
	e, ok := dc.Songs[filename]
	if !ok {
		return diskSongEntry{}, false
	}
	if e.Size != size || e.ModTime != modUnix {
		return diskSongEntry{}, false
	}
	return e, true
}

func diskCacheStore(dc *diskLibraryCache, filename string, e diskSongEntry) {
	diskCacheMu.Lock()
	dc.Songs[filename] = e
	diskCacheMu.Unlock()
}
