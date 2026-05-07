# ADR 0007: Module and Settings Contracts

## Status

Accepted

## Context

The first unlock list named modules such as Motion Trail, Wireframe Avatar, and Precision Export. Users need those modules to be real, discoverable, and explainable while locked. The challenge loop also needs adjustable dials because camera rooms, lighting, body scale, and mobility differ.

## Decision

Keep module metadata in a typed frontend module catalog. Each module has:

- Stable module ID.
- Unlock IDs that come from challenge completion.
- Unlocking challenge ID.
- Implemented status.
- Short description.
- Locked hint that tells the user how to unlock it.

Keep challenge tuning in a separate settings contract. Settings are local to the browser, normalized to safe ranges, persisted in `localStorage`, and passed into the real-time scoring engine. The initial dials are quality gate, hold-time scale, rep target adjustment, side-step sensitivity, balance lane, shoulder tolerance, progress decay, and auto-sync.

## Consequences

- The UI no longer shows unexplained `Locked` text.
- Module code can grow without hardcoding unlock logic across unrelated components.
- Real-time scoring remains deterministic because settings are explicit inputs, not hidden globals.
- Browser-only demo users can tune the experience without a backend.
