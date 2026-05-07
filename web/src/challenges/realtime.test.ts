import { describe, expect, it } from "vitest";
import type { Challenge } from "../api/types";
import type { PoseSnapshot } from "../pose/usePoseTracker";
import { initialRealtimeState, updateRealtimeChallenge } from "./realtime";
import { defaultChallengeSettings } from "./settings";

const baseChallenge: Challenge = {
  id: "calibrate-frame",
  title: "Frame Calibration",
  category: "calibration",
  mechanic: "hold-visible",
  description: "Hold still.",
  targetSeconds: 2,
  minimumScore: 0.7,
  minimumVisibility: 0.6,
  cues: [],
  unlocks: []
};

function snapshot(overrides: Partial<PoseSnapshot> = {}): PoseSnapshot {
  return {
    score: 0.85,
    visibility: 0.8,
    inFrameRatio: 1,
    centerX: 0.5,
    shoulderTilt: 0.02,
    handsAboveHead: false,
    handsAboveShoulders: false,
    reps: 0,
    durationSeconds: 0,
    hasPose: true,
    capturedAtMs: 0,
    targetLabel: "Full body",
    targetLocked: true,
    targetVisibility: 0.8,
    ...overrides
  };
}

describe("real-time challenge state", () => {
  it("completes a hold challenge after enough live time", () => {
    let state = initialRealtimeState(baseChallenge.id);

    state = updateRealtimeChallenge(baseChallenge, snapshot({ capturedAtMs: 1000 }), state);
    state = updateRealtimeChallenge(baseChallenge, snapshot({ capturedAtMs: 3000 }), state);
    state = updateRealtimeChallenge(baseChallenge, snapshot({ capturedAtMs: 5000 }), state);

    expect(state.completed).toBe(true);
    expect(state.durationSeconds).toBe(2);
  });

  it("counts alternating side hits", () => {
    const challenge = { ...baseChallenge, id: "side-step-spark", mechanic: "side-steps", targetReps: 2 };
    let state = initialRealtimeState(challenge.id);

    state = updateRealtimeChallenge(challenge, snapshot({ centerX: 0.5, capturedAtMs: 1000 }), state);
    state = updateRealtimeChallenge(challenge, snapshot({ centerX: 0.38, capturedAtMs: 1200 }), state);
    state = updateRealtimeChallenge(challenge, snapshot({ centerX: 0.62, capturedAtMs: 1400 }), state);

    expect(state.reps).toBe(2);
    expect(state.completed).toBe(true);
  });

  it("uses settings to make hold targets adjustable", () => {
    const settings = { ...defaultChallengeSettings, timeScale: 0.5 };
    let state = initialRealtimeState(baseChallenge.id);

    state = updateRealtimeChallenge(baseChallenge, snapshot({ capturedAtMs: 1000 }), state, settings);
    state = updateRealtimeChallenge(baseChallenge, snapshot({ capturedAtMs: 2000 }), state, settings);

    expect(state.completed).toBe(true);
  });
});
