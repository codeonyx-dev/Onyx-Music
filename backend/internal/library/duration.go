package library

import (
	"io"
	"os"
	"path/filepath"
	"strings"
)

var mpeg1Layer3Bitrates = [16]int{
	0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0,
}

func audioDuration(filePath string, fileSize int64) float64 {
	if fileSize <= 0 {
		if info, err := os.Stat(filePath); err == nil {
			fileSize = info.Size()
		}
	}
	if strings.ToLower(filepath.Ext(filePath)) == ".mp3" {
		return mp3DurationEstimate(filePath, fileSize)
	}
	return 0
}

func mp3DurationEstimate(filePath string, fileSize int64) float64 {
	if fileSize <= 0 {
		return 0
	}

	f, err := os.Open(filePath)
	if err != nil {
		return 0
	}
	defer f.Close()

	id3Size, err := skipID3v2(f)
	if err != nil {
		return 0
	}

	const probeSize = 256 * 1024
	buf := make([]byte, probeSize)
	n, err := f.Read(buf)
	if err != nil && err != io.EOF {
		return 0
	}
	buf = buf[:n]

	if d := xingDuration(buf); d > 0 {
		return d
	}
	if d := vbriDuration(buf); d > 0 {
		return d
	}

	bitrate := firstMP3Bitrate(buf)
	if bitrate <= 0 {
		bitrate = 128000
	}

	audioBytes := fileSize - id3Size - 128
	if audioBytes <= 0 {
		return 0
	}
	return float64(audioBytes*8) / float64(bitrate)
}

func skipID3v2(f *os.File) (int64, error) {
	if _, err := f.Seek(0, io.SeekStart); err != nil {
		return 0, err
	}
	hdr := make([]byte, 10)
	if _, err := io.ReadFull(f, hdr); err != nil {
		return 0, err
	}
	if string(hdr[0:3]) != "ID3" {
		if _, err := f.Seek(0, io.SeekStart); err != nil {
			return 0, err
		}
		return 0, nil
	}
	size := int64(((int(hdr[6]) & 0x7f) << 21) | ((int(hdr[7]) & 0x7f) << 14) | ((int(hdr[8]) & 0x7f) << 7) | (int(hdr[9]) & 0x7f))
	total := int64(10) + size
	if _, err := f.Seek(total, io.SeekStart); err != nil {
		return 0, err
	}
	return total, nil
}

func firstMP3Bitrate(data []byte) int {
	for i := 0; i+4 < len(data); i++ {
		if data[i] != 0xff || (data[i+1]&0xe0) != 0xe0 {
			continue
		}
		version := (data[i+1] >> 3) & 0x03
		layer := (data[i+1] >> 1) & 0x03
		if version != 0x03 || layer != 0x01 {
			continue
		}
		idx := int((data[i+2] >> 4) & 0x0f)
		if idx == 0 || idx == 15 {
			continue
		}
		return mpeg1Layer3Bitrates[idx] * 1000
	}
	return 0
}

func xingDuration(data []byte) float64 {
	marker := []byte("Xing")
	info := []byte("Info")
	for i := 0; i+12 < len(data); i++ {
		if !bytesEqual(data[i:i+4], marker) && !bytesEqual(data[i:i+4], info) {
			continue
		}
		flags := int(data[i+4])<<24 | int(data[i+5])<<16 | int(data[i+6])<<8 | int(data[i+7])
		off := i + 8
		if flags&0x01 == 0 || off+4 > len(data) {
			continue
		}
		frames := int(data[off])<<24 | int(data[off+1])<<16 | int(data[off+2])<<8 | int(data[off+3])
		if frames <= 0 {
			continue
		}
		return float64(frames) * 1152.0 / 44100.0
	}
	return 0
}

func vbriDuration(data []byte) float64 {
	marker := []byte("VBRI")
	for i := 0; i+26 < len(data); i++ {
		if !bytesEqual(data[i:i+4], marker) {
			continue
		}
		frames := int(data[i+14])<<24 | int(data[i+15])<<16 | int(data[i+16])<<8 | int(data[i+17])
		if frames <= 0 {
			continue
		}
		return float64(frames) * 1152.0 / 44100.0
	}
	return 0
}

func bytesEqual(a, b []byte) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
