package model

type Library struct {
	Songs   []Song   `json:"songs"`
	Artists []Artist `json:"artists"`
	Albums  []Album  `json:"albums"`
}

type Artist struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	SongCount  int    `json:"song_count"`
	AlbumCount int    `json:"album_count"`
}

type Album struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	ArtistID  string `json:"artist_id"`
	Artist    string `json:"artist"`
	SongCount int    `json:"song_count"`
}
