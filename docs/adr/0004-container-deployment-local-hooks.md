# ADR 0004: Container Deployment and Local Hooks

## Status

Accepted

## Context

The server target should be able to run `docker compose pull` and serve the app on port `25342`. The user requested local hooks and smoke tests instead of GitHub Actions.

## Decision

Build a multi-stage Docker image that compiles the React frontend and Go backend into one runtime container. Use Nginx as the public reverse proxy on port `25342`, forwarding `/api`, `/healthz`, `/readyz`, and `/metrics` to the app container.

Local quality gates live in `scripts/check.sh`, `scripts/smoke.sh`, and `.githooks/`.

## Consequences

- The deployment path is close to production while staying Compose-friendly.
- The same image can be pushed as `linux/amd64` to GHCR.
- Local hooks are opt-in via `scripts/install-hooks.sh`, making developer machines explicit rather than magical.
