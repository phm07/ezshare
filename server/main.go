package main

import (
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/samber/slog-gin"
	"log/slog"
	"os"
	"server/storage"
	"server/storage/localstorage"
	"strings"
)

var (
	logger *slog.Logger
)

func main() {
	logger = slog.Default()

	storageType := os.Getenv("EZSHARE_STORAGE")
	if storageType == "" {
		logger.Info("no storage type specified, defaulting to local")
		storageType = "local"
	}

	var store storage.Storage

	switch storageType {
	case "local":
		dir := os.Getenv("EZSHARE_LOCALSTORAGE_DIR")
		if dir == "" {
			dir = "localstorage"
		}
		var err error
		store, err = localstorage.New(dir)
		if err != nil {
			logger.Error("error initializing local storage", "err", err)
			os.Exit(1)
			return
		}
	default:
		logger.Error(fmt.Sprintf("unknown storage type %s", storageType))
		os.Exit(1)
		return
	}

	logger.Info("initialized storage provider", "type", storageType)

	addr := os.Getenv("EZSHARE_ADDR")
	port := os.Getenv("EZSHARE_PORT")
	if port == "" {
		port = "8080"
	}

	r := gin.New()
	_ = r.SetTrustedProxies(nil)
	r.Use(sloggin.New(logger))
	r.Use(gin.Recovery())
	r.Use(static.Serve("/", static.LocalFile("static", true)))
	r.NoRoute(func(c *gin.Context) {
		if !strings.HasPrefix(c.Request.URL.Path, "/api/") &&
			!strings.HasPrefix(c.Request.URL.Path, "/raw/") {
			c.File("static/index.html")
		}
	})

	if gin.Mode() == gin.DebugMode {
		r.Use(cors.New(cors.Config{
			AllowAllOrigins: true,
		}))
	}

	ctrl := &controller{
		store: store,
	}
	r.POST("/api/upload", ctrl.HandleUpload)
	r.GET("/api/meta/:key", ctrl.HandleMeta)
	r.GET("/raw/:key", ctrl.HandleRaw)

	logger.Info("starting server", "bind_addr", addr, "port", port)
	_ = r.Run(addr + ":" + port)
}
