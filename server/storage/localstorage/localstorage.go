package localstorage

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"os"
	"path"
	"server/storage"
	"strings"
	"time"
)

type localStorage struct {
	dir string
}

func New(dir string) (storage.Storage, error) {
	err := os.MkdirAll(dir, 0700)
	if err != nil {
		return nil, err
	}
	ls := &localStorage{dir: dir}
	if err = ls.checkForExpiredFiles(); err != nil {
		return nil, err
	}
	go func() {
		for range time.Tick(time.Hour) {
			if err := ls.checkForExpiredFiles(); err != nil {
				slog.Error("localstorage: error while checking for expired files", "err", err)
			}
		}
	}()
	return ls, nil
}

func (ls *localStorage) Read(key string, w io.Writer) error {
	meta, err := ls.GetMetadata(key)
	if err != nil {
		return err
	}
	if meta == nil {
		return fmt.Errorf("metadata not found for key %s", key)
	}

	now := time.Now()
	if !meta.Expiry.IsZero() && now.After(meta.Expiry) {
		err = ls.delete(key)
		if err != nil {
			return err
		}
		return errors.New("file expired")
	}

	filePath := path.Join(ls.dir, key)
	f, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer func() {
		_ = f.Close()
	}()

	_, err = io.Copy(w, f)
	if err != nil {
		return err
	}
	return nil
}

func (ls *localStorage) Save(key string, meta *storage.Metadata, r io.Reader) error {
	filePath := path.Join(ls.dir, key)
	file, err := os.OpenFile(filePath, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0600)
	if err != nil {
		return err
	}
	defer func() {
		_ = file.Close()
	}()

	meta.FileSize, err = io.Copy(file, r)
	if err != nil {
		_ = os.Remove(filePath)
		return err
	}

	metaPath := path.Join(ls.dir, key+".meta")
	metaFile, err := os.OpenFile(metaPath, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0600)
	if err != nil {
		return err
	}
	defer func() {
		_ = metaFile.Close()
	}()

	if err = json.NewEncoder(metaFile).Encode(meta); err != nil {
		return err
	}

	return nil
}

func (ls *localStorage) KeyExists(key string) (bool, error) {
	meta, err := ls.GetMetadata(key)
	if err != nil {
		return false, err
	}
	return meta != nil, err
}

func (ls *localStorage) GetMetadata(key string) (*storage.Metadata, error) {
	filePath := path.Join(ls.dir, key+".meta")
	f, err := os.Open(filePath)
	if errors.Is(err, os.ErrNotExist) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	defer func() {
		_ = f.Close()
	}()

	var meta storage.Metadata
	if err = json.NewDecoder(f).Decode(&meta); err != nil {
		return nil, err
	}

	now := time.Now()
	if !meta.Expiry.IsZero() && now.After(meta.Expiry) {
		err = ls.delete(key)
		if err != nil {
			return nil, err
		}
		return nil, nil
	}

	return &meta, nil
}

func (ls *localStorage) delete(key string) error {
	filePath := path.Join(ls.dir, key)
	metaPath := path.Join(ls.dir, key+".meta")
	return errors.Join(os.Remove(filePath), os.Remove(metaPath))
}

func (ls *localStorage) checkForExpiredFiles() error {
	fmt.Println("running")
	dir, err := os.ReadDir(ls.dir)
	if err != nil {
		return err
	}

	for _, entry := range dir {
		if entry.IsDir() {
			continue
		}
		if !strings.HasSuffix(entry.Name(), ".meta") {
			continue
		}
		key := entry.Name()[0 : len(entry.Name())-5]

		meta, err := ls.GetMetadata(key)
		if err != nil {
			return err
		}

		if meta == nil {
			err = ls.delete(key)
			if err != nil {
				return err
			}
		}

		if meta.Expiry.IsZero() {
			continue
		}

		now := time.Now()
		if now.After(meta.Expiry) {
			err = ls.delete(key)
			if err != nil {
				return err
			}
		}
	}

	return nil
}
