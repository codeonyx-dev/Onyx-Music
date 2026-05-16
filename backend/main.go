package main

import (
	"log"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/dhowden/tag"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

type Song struct {
	Filename string  `json:"filename"`
	Title    string  `json:"title"`
	Artist   string  `json:"artist"`
	Duration float64 `json:"duration"`
	Size     int64   `json:"size"`
	HasCover bool    `json:"has_cover"`
}

func main() {
	loadConfig()

	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{"error": err.Error()})
		},
	})

	app.Use(logger.New(logger.Config{
		Format: "${time} | ${status} | ${latency} | ${method} ${path}\n",
	}))

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,OPTIONS",
		AllowHeaders: "Origin, Content-Type, Accept, Range, Authorization",
	}))

	app.Post("/api/auth/login", handleLogin)

	app.Get("/api/settings", handleSettings)

	api := app.Group("/api", authMiddleware)
	api.Get("/auth/me", handleMe)
	api.Get("/songs", handleGetSongs)
	api.Get("/stream/*", handleStream)
	api.Get("/cover/*", handleCover)

	app.Get("/health", handleHealth)

	log.Printf("Onyx API en http://0.0.0.0:%s", cfg.Port)
	log.Printf("Directorio de música: %s", cfg.MusicDir)
	log.Fatal(app.Listen(":" + cfg.Port))
}

func handleHealth(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":    "ok",
		"port":      cfg.Port,
		"music_dir": cfg.MusicDir,
	})
}

func handleGetSongs(c *fiber.Ctx) error {
	songs, err := getCachedSongs()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error al leer el directorio de música"})
	}
	c.Set("Cache-Control", "private, max-age=30")
	return c.JSON(fiber.Map{"songs": songs})
}

func handleSettings(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"prefetch_next":       cfg.PrefetchNext,
		"crossfade_default":   cfg.CrossfadeDefault,
		"audio_cache_enabled": true,
	})
}

func handleCover(c *fiber.Ctx) error {
	filePath, err := resolveRequestFile(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	if data, mime, ok := embeddedCover(filePath); ok {
		c.Set("Content-Type", mime)
		c.Set("Cache-Control", "public, max-age=604800, immutable")
		return c.Send(data)
	}

	if data, mime, ok := sidecarCover(filePath); ok {
		c.Set("Content-Type", mime)
		c.Set("Cache-Control", "public, max-age=604800, immutable")
		return c.Send(data)
	}

	return c.Status(404).JSON(fiber.Map{"error": "Carátula no encontrada"})
}

func resolveRequestFile(c *fiber.Ctx) (string, error) {
	raw := strings.TrimPrefix(c.Params("*"), "/")
	if raw == "" {
		return "", fiber.NewError(fiber.StatusBadRequest, "Nombre de archivo requerido")
	}

	decoded, err := url.PathUnescape(raw)
	if err != nil {
		decoded = raw
	}

	return safeFilePath(decoded)
}

func safeFilePath(filename string) (string, error) {
	filename = filepath.Base(filename)
	if filename == "" || filename == "." || filename == ".." {
		return "", fiber.NewError(fiber.StatusBadRequest, "Nombre de archivo inválido")
	}

	filePath := filepath.Join(cfg.MusicDir, filename)

	absMusicDir, err := filepath.Abs(cfg.MusicDir)
	if err != nil {
		return "", fiber.NewError(fiber.StatusInternalServerError, "Error de configuración")
	}

	absFilePath, err := filepath.Abs(filePath)
	if err != nil {
		return "", fiber.NewError(fiber.StatusBadRequest, "Ruta inválida")
	}

	prefix := absMusicDir + string(os.PathSeparator)
	if !strings.HasPrefix(absFilePath, prefix) {
		return "", fiber.NewError(fiber.StatusForbidden, "Acceso denegado")
	}

	return absFilePath, nil
}

func embeddedCover(filePath string) ([]byte, string, bool) {
	f, err := os.Open(filePath)
	if err != nil {
		return nil, "", false
	}
	defer f.Close()

	m, err := tag.ReadFrom(f)
	if err != nil {
		return nil, "", false
	}

	pic := m.Picture()
	if pic == nil || len(pic.Data) == 0 {
		return nil, "", false
	}

	mime := pic.MIMEType
	if mime == "" {
		mime = "image/jpeg"
	}

	return pic.Data, mime, true
}

func sidecarCover(audioPath string) ([]byte, string, bool) {
	base := strings.TrimSuffix(audioPath, filepath.Ext(audioPath))
	for _, ext := range []string{".jpg", ".jpeg", ".png", ".webp"} {
		path := base + ext
		data, err := os.ReadFile(path)
		if err == nil && len(data) > 0 {
			mime := "image/jpeg"
			switch ext {
			case ".png":
				mime = "image/png"
			case ".webp":
				mime = "image/webp"
			}
			return data, mime, true
		}
	}
	return nil, "", false
}

func isAudioExt(ext string) bool {
	switch ext {
	case ".mp3", ".wav", ".ogg", ".flac", ".m4a", ".aac":
		return true
	default:
		return false
	}
}

func parseFilename(filename string) (title, artist string) {
	name := strings.TrimSuffix(filename, filepath.Ext(filename))
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
