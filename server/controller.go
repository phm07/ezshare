package main

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"server/storage"
	"strconv"
	"time"
)

type controller struct {
	store storage.Storage
}

func (ctrl *controller) HandleUpload(c *gin.Context) {
	var expiry time.Duration

	expiryStr := c.PostForm("expiry")
	switch expiryStr {
	case "":
		c.String(http.StatusBadRequest, "Missing field 'expiry'")
		return
	case "never":
		break
	default:
		var err error
		expiry, err = time.ParseDuration(expiryStr)
		if err != nil {
			c.String(http.StatusBadRequest, "Invalid expiry '%s'", expiryStr)
			return
		}
		if expiry < time.Minute {
			c.String(http.StatusBadRequest, "Minimum expiry is %s", time.Minute)
			return
		}
		if expiry > 365*24*time.Hour {
			c.String(http.StatusBadRequest, "Maximum expiry is %s", 365*24*time.Hour)
			return
		}
	}

	mime := c.Request.FormValue("mime")
	if mime == "" {
		mime = "text/plain"
	}
	if len(mime) > 255 {
		c.String(http.StatusBadRequest, "Invalid mime type")
		return
	}

	f, _, err := c.Request.FormFile("file")
	if err != nil {
		c.String(http.StatusInternalServerError, "Internal server error")
		logger.Error("error while getting file from upload request", "err", err)
		return
	}

	defer func() {
		_ = f.Close()
	}()

	key, err := storage.FindFreeKey(ctrl.store)
	if err != nil {
		c.String(http.StatusInternalServerError, "Internal server error")
		logger.Error("could not find free key", "err", err)
		return
	}

	meta := &storage.Metadata{
		UploadedOn: time.Now(),
		MimeType:   mime,
	}

	if expiry > 0 {
		meta.Expiry = time.Now().Add(expiry).UTC()
	}

	err = ctrl.store.Save(key, meta, f)
	if err != nil {
		c.String(http.StatusInternalServerError, "Internal server error")
		logger.Error("could not store file", "err", err)
		return
	}
	c.String(http.StatusOK, key)
}

func (ctrl *controller) HandleRaw(c *gin.Context) {
	key := c.Param("key")
	if key == "" {
		c.String(http.StatusBadRequest, "Missing key")
		return
	}

	if !storage.ValidateKey(key) {
		c.String(http.StatusBadRequest, "Invalid key")
		return
	}

	meta, err := ctrl.store.GetMetadata(key)
	if err != nil {
		c.String(http.StatusInternalServerError, "Internal server error")
		logger.Error("error while getting metadata", "err", err)
		return
	}

	if meta == nil {
		c.Status(404)
		return
	}

	if err = ctrl.store.Read(key, c.Writer); err != nil {
		c.String(http.StatusInternalServerError, "Internal server error")
		logger.Error("error writing response", "err", err)
		return
	}

	c.Status(200)
	c.Header("Content-Disposition", "attachment; filename="+key)
	c.Header("Content-Type", meta.MimeType)
	c.Header("Content-Length", strconv.FormatInt(meta.FileSize, 10))
}

func (ctrl *controller) HandleMeta(c *gin.Context) {
	key := c.Param("key")
	if key == "" {
		c.String(http.StatusBadRequest, "Missing key")
		return
	}

	if !storage.ValidateKey(key) {
		c.String(http.StatusBadRequest, "Invalid key")
		return
	}

	meta, err := ctrl.store.GetMetadata(key)
	if err != nil {
		c.String(http.StatusInternalServerError, "Internal server error")
		logger.Error("error while getting metadata", "err", err)
		return
	}

	if meta == nil {
		c.Status(404)
		return
	}

	c.JSON(200, meta)
}
