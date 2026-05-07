# ADR 0001: Local-first Markerless Pose Tracking

## Status

Accepted

## Context

The product goal is a webcam-only markerless motion-tracking system that can later grow into an interactive challenge layer. FreeMoCap demonstrates the value of accessible markerless capture without suits, markers, or proprietary hardware.

Camera frames are sensitive biometric data. Sending raw frames to a backend would increase privacy risk, network cost, and operational complexity before the product needs it.

## Decision

Pose inference runs in the browser with MediaPipe Tasks Vision. The Go backend receives challenge events, landmark-quality summaries, and session metadata only. Raw camera frames and recordings stay client-side unless a future explicit export workflow is designed and documented.

## Consequences

- The first playable experience works with a normal webcam and no server-side GPU.
- Privacy posture is stronger because the backend does not need raw video.
- Browser compatibility and model-loading behavior become core QA concerns.
- Future multi-camera capture or offline scientific exports will need separate ADRs.
