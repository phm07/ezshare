package storage

import (
	"io"
	"math/rand"
	"strings"
	"time"
)

type Storage interface {
	KeyExists(key string) (bool, error)
	GetMetadata(key string) (*Metadata, error)
	Save(key string, meta *Metadata, r io.Reader) error
	Read(key string, w io.Writer) error
}

type Metadata struct {
	Expiry     time.Time `json:"expires_on,omitempty"`
	UploadedOn time.Time `json:"uploaded_on"`
	MimeType   string    `json:"mime_type"`
	FileSize   int64     `json:"file_size"`
}

var (
	vowels     = []byte{'a', 'e', 'i', 'o', 'u'}
	consonants = []byte{'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'}
)

func GenerateKey() string {
	sb := strings.Builder{}
	for i := 0; i < 10; i++ {
		sb.WriteByte(consonants[rand.Intn(len(consonants))])
		sb.WriteByte(vowels[rand.Intn(len(vowels))])
	}
	return sb.String()
}

func FindFreeKey(store Storage) (string, error) {
	var key string
	for {
		key = GenerateKey()
		exists, err := store.KeyExists(key)
		if err != nil {
			return "", err
		}
		if !exists {
			break
		}
	}
	return key, nil
}

func ValidateKey(key string) bool {
	for _, r := range key {
		if r < 'a' || r > 'z' {
			return false
		}
	}
	return true
}
