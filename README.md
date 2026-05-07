# Markerless Quest Lab

Markerless Quest Lab is a webcam-only motion-tracking playground inspired by the local-first spirit of [FreeMoCap](https://freemocap.org/) and its open-source project. The first milestone is a browser pose-tracking experience with sidequests that turn calibration and movement drills into unlockable interaction loops.

The repository is intentionally shaped like a deployable product from day one:

- Go backend with modular packages, structured logging, health endpoints, and Prometheus metrics.
- React + Vite frontend using MediaPipe Tasks Vision for battle-tested markerless pose landmarks in the browser.
- Docker Compose and Nginx deployment assets for port `25342`.
- Local git hooks and smoke checks instead of GitHub Actions.
- ADRs documenting the major technical choices.

## Architecture

```mermaid
flowchart LR
    Browser["React GUI<br/>Webcam + MediaPipe pose tracking"] --> API["Go API<br/>Challenges + sessions"]
    Browser --> MetricsView["Live pose quality<br/>client state"]
    API --> Prom["/metrics<br/>Prometheus scrape"]
    Nginx["Nginx :25342"] --> Browser
    Nginx --> API
```

The webcam stream stays in the browser. The backend receives only high-level challenge events and session metadata.

## Local Development

Prerequisites:

- Go 1.24 or newer
- Node.js 20 or newer
- Docker with Compose plugin

```bash
cp .env.example .env
go mod download
npm --prefix web install
npm --prefix web run dev
go run ./cmd/server
```

Open the frontend at the Vite URL during development. For a production-shaped local run:

```bash
docker compose up --build
open http://localhost:25342
```

## Checks

```bash
./scripts/check.sh
./scripts/smoke.sh
./scripts/install-hooks.sh
```

The hooks run the same local checks before commits and pushes. No CI configuration is included by design.

## Container Publishing

Build an amd64 image for GitHub Container Registry:

```bash
docker buildx build \
  --platform linux/amd64 \
  -t ghcr.io/baditaflorin/markerless-quest-lab:latest \
  --push .
```

Then on the server:

```bash
docker compose -f deploy/docker-compose.server.yml pull
docker compose -f deploy/docker-compose.server.yml up -d
```

## Security Notes

- Do not commit `.env`, camera recordings, private keys, token files, or user exports containing biometric data.
- Webcam frames are processed in-browser by default.
- Server events should contain movement summaries and challenge IDs, not raw images.

## Documentation

- [ADR 0001: Local-first markerless pose tracking](docs/adr/0001-local-first-markerless-tracking.md)
- [ADR 0002: Go API and observability stack](docs/adr/0002-go-api-observability.md)
- [ADR 0003: Challenge GUI and unlock model](docs/adr/0003-challenge-gui-unlocks.md)
- [ADR 0004: Container deployment and local hooks](docs/adr/0004-container-deployment-local-hooks.md)
