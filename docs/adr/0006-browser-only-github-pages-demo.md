# ADR 0006: Browser-only GitHub Pages Demo

## Status

Accepted

## Context

A public demo should run directly from the browser, including on GitHub Pages. The backend is still useful for Docker Compose deployments, metrics, and future persistence, but the first public experience should not require a server.

The project also avoids GitHub Actions, so Pages publishing must be local and explicit.

## Decision

Support a static demo mode in the frontend. In static mode, the app uses a local challenge catalog and local session/progress responses while continuing to run MediaPipe WASM in the browser.

Publish GitHub Pages through a local script:

```bash
./scripts/publish-pages.sh
```

The script builds with `VITE_STATIC_DEMO=true`, writes the static assets to a `gh-pages` branch, and pushes that branch. No GitHub Actions workflow is required.

## Consequences

- The live demo can be hosted from GitHub Pages.
- Docker deployments can still use the Go API and Prometheus metrics.
- Browser-only progress is per-session and not durable across devices until a storage backend is added.
