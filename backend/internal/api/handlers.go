package api

import (
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"music-player-backend/internal/config"
	"music-player-backend/internal/library"
)

func resolveParam(c *fiber.Ctx) (string, error) {
	raw := strings.TrimPrefix(c.Params("*"), "/")
	if raw == "" {
		return "", fiber.NewError(fiber.StatusBadRequest, "Referencia requerida")
	}
	decoded, err := url.PathUnescape(raw)
	if err != nil {
		decoded = raw
	}
	return decoded, nil
}

func HandleHealth(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":    "ok",
		"port":      config.C.Port,
		"music_dir": config.C.MusicDir,
	})
}

func HandleSettings(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"prefetch_next":       config.C.PrefetchNext,
		"crossfade_default":   config.C.CrossfadeDefault,
		"audio_cache_enabled": true,
	})
}

func HandleGetSongs(c *fiber.Ctx) error {
	songs, err := library.GetSongs()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error al leer la biblioteca"})
	}
	c.Set("Cache-Control", "private, max-age=30")
	return c.JSON(fiber.Map{"songs": songs})
}

func HandleGetLibrary(c *fiber.Ctx) error {
	lib, err := library.GetLibrary()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error al leer la biblioteca"})
	}
	c.Set("Cache-Control", "private, max-age=30")
	return c.JSON(lib)
}

func HandleLibraryStatus(c *fiber.Ctx) error {
	return c.JSON(library.GetStatus())
}

func HandleLibraryRescan(c *fiber.Ctx) error {
	if !library.TriggerRescan() {
		return c.Status(409).JSON(fiber.Map{"error": "Ya hay un escaneo en curso"})
	}
	return c.JSON(fiber.Map{"ok": true, "scanning": true})
}

func HandleStream(c *fiber.Ctx) error {
	ref, err := resolveParam(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	filePath, err := library.ResolveRef(ref)
	if err != nil {
		if err.Error() == "pista no encontrada" {
			return c.Status(404).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	fi, err := os.Stat(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return c.Status(404).JSON(fiber.Map{"error": "Archivo no encontrado"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Error al acceder al archivo"})
	}
	if fi.IsDir() {
		return c.Status(400).JSON(fiber.Map{"error": "No es un archivo de audio"})
	}

	ext := filepath.Ext(filePath)
	etag := fmt.Sprintf(`"%d-%d"`, fi.ModTime().Unix(), fi.Size())

	c.Set("Content-Type", mimeForAudio(ext))
	c.Set("Accept-Ranges", "bytes")
	c.Set("ETag", etag)
	c.Set("Last-Modified", fi.ModTime().UTC().Format("Mon, 02 Jan 2006 15:04:05 GMT"))
	c.Set("Cache-Control", "private, max-age="+strconv.Itoa(config.C.StreamCacheMaxAge))
	c.Set("X-Accel-Buffering", "no")

	if c.Get("If-None-Match") == etag {
		return c.SendStatus(fiber.StatusNotModified)
	}

	return c.SendFile(filePath)
}

func HandleCover(c *fiber.Ctx) error {
	ref, err := resolveParam(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	filePath, err := library.ResolveRef(ref)
	if err != nil {
		if err.Error() == "pista no encontrada" {
			return c.Status(404).JSON(fiber.Map{"error": err.Error()})
		}
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

func mimeForAudio(ext string) string {
	switch strings.ToLower(ext) {
	case ".mp3":
		return "audio/mpeg"
	case ".flac":
		return "audio/flac"
	case ".ogg":
		return "audio/ogg"
	case ".wav":
		return "audio/wav"
	case ".m4a", ".aac":
		return "audio/mp4"
	default:
		return "application/octet-stream"
	}
}
