package library

import (
	"sync"
	"sync/atomic"
)

type Status struct {
	Scanning  bool `json:"scanning"`
	SongCount int  `json:"song_count"`
	Error     string `json:"error,omitempty"`
}

var (
	scanRunning atomic.Bool
	scanErr     string
	scanErrMu   sync.Mutex
)

func GetStatus() Status {
	libraryMu.RLock()
	count := len(libraryBundle.Songs)
	libraryMu.RUnlock()

	scanErrMu.Lock()
	errMsg := scanErr
	scanErrMu.Unlock()

	st := Status{
		Scanning:  scanRunning.Load(),
		SongCount: count,
	}
	if errMsg != "" {
		st.Error = errMsg
	}
	return st
}

func TriggerRescan() bool {
	if !scanRunning.CompareAndSwap(false, true) {
		return false
	}

	scanErrMu.Lock()
	scanErr = ""
	scanErrMu.Unlock()

	go func() {
		defer scanRunning.Store(false)

		InvalidateCache()
		_, err := GetLibrary()
		if err != nil {
			scanErrMu.Lock()
			scanErr = err.Error()
			scanErrMu.Unlock()
		}
	}()

	return true
}
