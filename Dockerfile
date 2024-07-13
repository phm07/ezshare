FROM node:22-alpine AS frontend-build

WORKDIR /build

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

FROM golang:1.22-alpine AS server-build

WORKDIR /build
COPY server/ .

ENV GOCACHE=/.cache/gocache
ENV GOMODCACHE=/.cache/gomodcache
RUN --mount=type=cache,target="/.cache" \
    go build -ldflags "-s -w" -trimpath -o main .

FROM scratch

ENV GIN_MODE=release
WORKDIR /app
COPY --from=frontend-build /build/dist /app/static
COPY --from=server-build /build/main /app/main
EXPOSE 8080

ENTRYPOINT ["/app/main"]