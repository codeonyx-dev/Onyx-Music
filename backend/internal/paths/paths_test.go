package paths

import (
	"os"
	"path/filepath"
	"testing"

	"music-player-backend/internal/config"
)

func TestSafeMusicPath(t *testing.T) {
	dir := t.TempDir()
	config.C.MusicDir = dir

	_ = os.WriteFile(filepath.Join(dir, "a.mp3"), []byte("x"), 0644)
	sub := filepath.Join(dir, "Artist")
	_ = os.Mkdir(sub, 0755)
	_ = os.WriteFile(filepath.Join(sub, "b.mp3"), []byte("y"), 0644)

	got, err := SafeMusicPath("a.mp3")
	if err != nil || filepath.Base(got) != "a.mp3" {
		t.Fatalf("a.mp3: got %q err %v", got, err)
	}

	got, err = SafeMusicPath("Artist/b.mp3")
	if err != nil || filepath.Base(got) != "b.mp3" {
		t.Fatalf("subfolder: got %q err %v", got, err)
	}

	if _, err := SafeMusicPath("../etc/passwd"); err == nil {
		t.Fatal("expected error for traversal")
	}
}

func TestSongIDStable(t *testing.T) {
	a := SongID("Artist/track.mp3")
	b := SongID("Artist/track.mp3")
	if a != b || len(a) != 16 {
		t.Fatalf("id=%q", a)
	}
}
