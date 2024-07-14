![GitHub Release](https://img.shields.io/github/v/release/phm07/ezshare)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/phm07/ezshare/docker.yaml?label=CI)
![GitHub go.mod Go version](https://img.shields.io/github/go-mod/go-version/phm07/ezshare?filename=server%2Fgo.mod)

# Overview

ezShare is a self-hosted service that aims to make sharing files and code easy and fast. 
It is written in Go and React and is designed to be lightweight and easy to deploy.

# Deployment

Deployment is easiest with Docker. Below you can see an example deployment with Docker Compose.

```yaml
# docker-compose.yaml
services:
  ezshare:
    image: ghcr.io/phm07/ezshare:latest
    environment:
      EZSHARE_STORAGE: local
      EZSHARE_LOCALSTORAGE_DIR: /data
    ports:
     - "80:8080"
    restart: always
    volumes:
    - "./data:/data"
```

This will make ezShare accessible on port 80. You should put it behind a reverse proxy
to enable https. Objects will be stored in a local directory called `data`.

# Configuration

ezShare is configured using environment variables. Below is an overview of all available options.

| Name                       | Default        | Description                                            |
|----------------------------|----------------|--------------------------------------------------------|
| `EZSHARE_ADDR`             |                | Address to bind on. Binds to all addresses by default. |
| `EZSHARE_PORT`             | `8080`         | Port to bind on                                        |
| `EZSHARE_STORAGE`          | `local`        | Storage type to use.<br/> Available values: `local`    |
| `EZSHARE_LOCALSTORAGE_DIR` | `localstorage` | Where to store objects if local storage is used.       |

# Roadmap

- [ ] Add support for PostgreSQL/MySQL storage backends
- [ ] Add support for S3 storage backend
- [ ] Allow configuring max file size
- [ ] Allow configuring max expiry time
- [ ] Add support for password protection
