package model

type Song struct {
	ID       string  `json:"id"`
	Filename string  `json:"filename"`
	Title    string  `json:"title"`
	Artist   string  `json:"artist"`
	ArtistID string  `json:"artist_id"`
	Album    string  `json:"album"`
	AlbumID  string  `json:"album_id"`
	Duration float64 `json:"duration"`
	Size     int64   `json:"size"`
	HasCover bool    `json:"has_cover"`
}
