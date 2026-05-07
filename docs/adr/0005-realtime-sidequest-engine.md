# ADR 0005: Real-time Sidequest Engine and Unlock Modules

## Status

Accepted

## Context

The sidequests need to feel interactive while the user is moving. A manual submit flow is useful for sync, but it cannot be the primary experience. The unlock rewards also need to exist as product features, not just labels in the challenge catalog.

## Decision

Run sidequest evaluation in the browser on every pose snapshot. The server catalog declares the mechanic for each challenge, while the frontend owns low-latency scoring for hold, squat, hand-raise, balance, and side-step mechanics.

Unlocked modules are implemented as:

- Motion trail overlay: live center-of-body trace rendered over the capture stage.
- Wireframe avatar: live pose-driven avatar panel unlocked by squat control.
- Precision export preview: session JSON preview and export control unlocked by balance quality.

The backend still receives completion/progress events for Docker deployments and observability.

## Consequences

- The experience reacts immediately without waiting on HTTP round trips.
- The same challenge catalog works in backend mode and browser-only demo mode.
- Some challenge scoring is intentionally playful rather than clinical; scientific exports will need stricter validation later.
