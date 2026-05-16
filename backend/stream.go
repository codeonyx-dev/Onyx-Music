package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
)

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

func handleStream(c *fiber.Ctx) error {
	filePath, err := resolveRequestFile(c)
	if err != nil {
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
	c.Set("Cache-Control", "private, max-age="+strconv.Itoa(cfg.StreamCacheMaxAge))
	c.Set("X-Accel-Buffering", "no")

	if c.Get("If-None-Match") == etag {
		return c.SendStatus(fiber.StatusNotModified)
	}

	return c.SendFile(filePath)
}
