# ADR 0008: Viewport Tracking and Art Controls

## Status

Accepted

## Context

Manual testing showed the camera stage could become taller than the visible browser viewport, forcing the user to scroll before seeing the live feed. The app also needed more control over tracking detail, model capacity, target body region, and visual style so it feels like an interactive art instrument rather than only a tracker.

## Decision

Use a cockpit layout: the page itself does not scroll on desktop, the side panels scroll independently, and the capture stage is constrained to a visible 16:9 viewport.

Expose pose controls as settings:

- Vision model: lite, full, heavy.
- Landmark detail: core points or all points.
- Target lock: full body, hands, feet, upper body, lower body.
- Art style: neon trace, constellation, ink echo, thermal bloom, blueprint.

The pose renderer reads these settings through a typed `PoseTrackerOptions` contract. Model variant changes reload the MediaPipe landmarker while the camera remains active. Target lock changes highlight and score the selected body region without changing the challenge catalog.

## Consequences

- The camera is visible immediately on desktop.
- Users can trade model capacity for speed or precision.
- The same pose stream supports whole-body tracking and body-part-focused exploration.
- Art direction can evolve through small palette/rendering contracts instead of scattered CSS and canvas conditionals.
