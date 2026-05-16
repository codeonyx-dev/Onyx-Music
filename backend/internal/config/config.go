package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	MusicDir          string
	Port              string
	CacheDir          string
	OnyxUser          string
	OnyxPassword      string
	JWTSecret         string
	PrefetchNext      bool
	CrossfadeDefault  bool
	StreamCacheMaxAge int
}

var C Config

func Load() {
	C = Config{
		MusicDir:          envOr("MUSIC_DIR", "./music"),
		Port:              envOr("PORT", "9090"),
		CacheDir:          envOr("CACHE_DIR", ""),
		OnyxUser:          envOr("ONYX_USER", "admin"),
		OnyxPassword:      envOr("ONYX_PASSWORD", "onyx123"),
		JWTSecret:         envOr("JWT_SECRET", "onyx-dev-secret-change-in-production"),
		PrefetchNext:      envBool("PREFETCH_NEXT", true),
		CrossfadeDefault:  envBool("CROSSFADE_DEFAULT", false),
		StreamCacheMaxAge: envInt("STREAM_CACHE_MAX_AGE", 3600),
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envBool(key string, fallback bool) bool {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	switch strings.ToLower(v) {
	case "1", "true", "yes", "on":
		return true
	case "0", "false", "no", "off":
		return false
	default:
		return fallback
	}
}

func envInt(key string, fallback int) int {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return n
}
