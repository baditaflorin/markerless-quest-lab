# ADR 0002: Go API and Observability Stack

## Status

Accepted

## Context

The backend needs to be small, reliable, and easy to deploy with Docker Compose. It should expose health information, challenge state, and metrics without becoming a custom framework.

## Decision

Use Go with `chi` for HTTP routing, `zerolog` for structured logs, and Prometheus client libraries for metrics. Keep packages organized by responsibility under `internal/`:

- `config` for environment parsing.
- `challenge` for sidequest catalog and progression.
- `httpapi` for transport handlers and middleware.
- `telemetry` for metrics registration and instrumentation.

## Consequences

- The API is boring in the best way: simple binaries, small runtime surface, and easy local tests.
- Prometheus can scrape `/metrics` directly.
- Transport code stays separate from challenge rules, which keeps tests focused.
