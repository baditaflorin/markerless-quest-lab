import { describe, expect, it } from "vitest";
import { estimateSquatPhase, scorePoseQuality, updateSquatCounter, type LandmarkLike } from "./poseScoring";

function landmarks(overrides: Record<number, Partial<LandmarkLike>> = {}): LandmarkLike[] {
  return Array.from({ length: 33 }, (_, index) => ({
    x: overrides[index]?.x ?? 0.5,
    y: overrides[index]?.y ?? 0.5,
    visibility: overrides[index]?.visibility ?? 0.9
  }));
}

describe("pose scoring", () => {
  it("scores visible in-frame landmarks highly", () => {
    const score = scorePoseQuality(landmarks());

    expect(score.score).toBeGreaterThan(0.85);
    expect(score.inFrameRatio).toBe(1);
  });

  it("penalizes missing frame coverage", () => {
    const score = scorePoseQuality(
      landmarks({
        0: { x: 1.2 },
        11: { y: -0.2 },
        28: { x: -0.2 }
      })
    );

    expect(score.score).toBeLessThan(0.9);
    expect(score.inFrameRatio).toBeLessThan(1);
  });
});

describe("squat counter", () => {
  it("counts a down-to-up cycle", () => {
    const down = landmarks({ 23: { y: 0.63 }, 24: { y: 0.63 }, 25: { y: 0.72 }, 26: { y: 0.72 } });
    const up = landmarks({ 23: { y: 0.45 }, 24: { y: 0.45 }, 25: { y: 0.72 }, 26: { y: 0.72 } });

    expect(estimateSquatPhase(down)).toBe("down");
    expect(estimateSquatPhase(up)).toBe("up");

    const afterDown = updateSquatCounter(down, { phase: "up", reps: 0 });
    const afterUp = updateSquatCounter(up, afterDown);

    expect(afterUp.reps).toBe(1);
  });
});
