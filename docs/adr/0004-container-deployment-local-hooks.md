# ADR 0004: Container Deployment and Local Hooks

## Status

Accepted

## Context

The server target should be able to run `docker compose pull` and serve the app on port `25342`. The user requested local hooks and smoke tests instead of GitHub Actions.

## Decision

Build separate multi-stage images for the Go API and the Nginx-served React frontend. Use Nginx as the public reverse proxy on port `25342`, forwarding `/api`, `/healthz`, `/readyz`, and `/metrics` to the app container. The server Compose file uses GHCR image names and pins `platform: linux/amd64` so a remote server can pull prebuilt images.

Local quality gates live in `scripts/check.sh`, `scripts/smoke.sh`, and `.githooks/`.

## Consequences

- The deployment path is close to production while staying Compose-friendly.
- The same image can be pushed as `linux/amd64` to GHCR.
- Local hooks are opt-in via `scripts/install-hooks.sh`, making developer machines explicit rather than magical.
