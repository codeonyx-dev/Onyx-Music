package store

import (
	"sort"
	"strings"

	"music-player-backend/internal/model"
)

func sortArtists(a []model.Artist) {
	sort.Slice(a, func(i, j int) bool {
		return strings.ToLower(a[i].Name) < strings.ToLower(a[j].Name)
	})
}

func sortAlbums(a []model.Album) {
	sort.Slice(a, func(i, j int) bool {
		ai := strings.ToLower(a[i].Artist + "\x00" + a[i].Name)
		aj := strings.ToLower(a[j].Artist + "\x00" + a[j].Name)
		return ai < aj
	})
}
