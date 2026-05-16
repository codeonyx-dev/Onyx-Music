package main

import (
	"strconv"
	"strings"

	"github.com/dhowden/tag"
)

func durationFromTags(m tag.Metadata) float64 {
	raw := m.Raw()
	if raw == nil {
		return 0
	}

	keys := []string{"Length", "TLEN", "length", "DURATION"}
	for _, key := range keys {
		v, ok := raw[key]
		if !ok {
			continue
		}
		switch t := v.(type) {
		case string:
			s := strings.TrimSpace(t)
			if s == "" {
				continue
			}
			if ms, err := strconv.ParseFloat(s, 64); err == nil && ms > 0 {
				// TLEN suele estar en milisegundos
				if strings.EqualFold(key, "TLEN") || ms > 10000 {
					return ms / 1000
				}
				return ms
			}
		case int:
			if t > 0 {
				return float64(t)
			}
		case int64:
			if t > 0 {
				return float64(t)
			}
		case float64:
			if t > 0 {
				return t
			}
		}
	}

	return 0
}
