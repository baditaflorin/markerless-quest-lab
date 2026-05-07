# ADR 0003: Challenge GUI and Unlock Model

## Status

Accepted

## Context

The experience should feel like a motion-capture GUI that is becoming playable, not a static demo. Users need confidence indicators, calibration status, active sidequests, and visible rewards.

## Decision

Build the frontend with React, TypeScript, Vite, and TanStack Query. Use MediaPipe Tasks Vision for pose detection and keep challenge evaluation transparent in the UI. The initial unlock loop is:

1. Calibrate webcam and visibility.
2. Complete movement sidequests.
3. Unlock interaction modules such as trail overlays, avatar skins, and export previews.

## Consequences

- The GUI can evolve into a richer capture tool without discarding the playful layer.
- Sidequests are server-defined so the backend can later personalize them.
- The frontend owns real-time pose interpretation and renders feedback immediately.
