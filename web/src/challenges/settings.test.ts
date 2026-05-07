import { describe, expect, it } from "vitest";
import { defaultChallengeSettings, normalizeSettings } from "./settings";

describe("challenge settings", () => {
  it("clamps user dials to supported ranges", () => {
    const settings = normalizeSettings({
      ...defaultChallengeSettings,
      qualityGateOffset: 2,
      timeScale: 9,
      repAdjustment: 99,
      sideStepSensitivity: -1,
      balanceTolerance: 9,
      shoulderTolerance: -1,
      progressDecay: 99
    });

    expect(settings.qualityGateOffset).toBe(0.2);
    expect(settings.timeScale).toBe(1.8);
    expect(settings.repAdjustment).toBe(5);
    expect(settings.sideStepSensitivity).toBe(0.04);
    expect(settings.balanceTolerance).toBe(0.22);
    expect(settings.shoulderTolerance).toBe(0.03);
    expect(settings.progressDecay).toBe(3);
  });
});
