package main

import (
	"music-player-backend/internal/api"
	"music-player-backend/internal/config"
)

func main() {
	config.Load()
	api.Run()
}
