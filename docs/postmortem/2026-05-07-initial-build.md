# Postmortem: Initial Repository Build

Date: 2026-05-07

## Summary

The initial Markerless Quest Lab repository was created with a Go API, React/MediaPipe frontend, Docker Compose deployment, Nginx reverse proxy, Prometheus metrics, ADRs, local hooks, tests, and smoke checks.

No users were impacted. This postmortem records the implementation issues found during the first build so the project starts with a clear operating baseline.

## What Went Well

- The first backend test run caught a metrics handler type mismatch before commit.
- Frontend tests and production build passed before the UI slice was committed.
- Docker Compose built both the API and web images successfully.
- The Compose stack started locally and served health, API, and metrics through Nginx on port `25342`.
- Secret scanning is now part of the local checks and git hook path.

## Issues Found

- The metrics endpoint test initially expected an HTTP counter before any labeled request had been observed.
- The first capture UI wiring used a hidden video element for the webcam stream, leaving the visible capture surface detached.
- The smoke script printed noisy connection errors while waiting for the API to boot.
- ADR 0004 originally described one combined runtime image, but the better deployment shape became separate API and web images.
- After the first push, browser testing showed jsDelivr returned `404` for `@mediapipe/tasks-vision@0.10.22/wasm/vision_wasm_internal.js`.
- Manual submit exposed an API contract bug: incomplete progress encoded `unlocks` as `null`, while the frontend expected an array.
- The first unlock catalog named motion trail, wireframe avatar, and precision export rewards before those modules existed in the GUI.

## Fixes Applied

- The metrics test now makes a request before scraping `/metrics`.
- The visible camera element now receives the tracker ref directly.
- Smoke health polling suppresses expected startup failures.
- ADR 0004 and README were updated to match the two-image GHCR deployment model.
- MediaPipe WASM runtime files are now vendored into the Vite public asset tree and referenced by stable app-local URLs.
- Progress responses now always initialize `unlocks` to an empty array, and the frontend tolerates older `null` responses.
- Unlocks now map to real UI modules: motion trail overlay, wireframe avatar, and precision export preview.
- A browser-only static demo mode and local GitHub Pages publishing script were added.

## Validation

Completed successfully:

- `go test ./...`
- `npm --prefix web run test`
- `npm --prefix web run build`
- `npm --prefix web run build:pages`
- `./scripts/check.sh`
- `./scripts/smoke.sh`
- `docker compose build`
- `docker compose up -d api web`
- `curl http://127.0.0.1:25342/healthz`
- `curl http://127.0.0.1:25342/api/challenges`
- `curl http://127.0.0.1:25342/metrics`

## Remaining Risks

- MediaPipe model and WASM assets are loaded from pinned public URLs; future offline or air-gapped deployment should vendor these assets.
- Challenge progress is in memory only; persistent profiles and unlock history need a storage ADR.
- Webcam behavior still needs manual cross-browser testing on the target server URL because camera permissions require a browser context.
- `/metrics` is proxied through Nginx for convenience; internet-facing deployments should restrict it at the network or reverse-proxy layer.
