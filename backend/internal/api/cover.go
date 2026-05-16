package api

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/dhowden/tag"
)

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
