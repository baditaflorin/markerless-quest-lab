import { describe, expect, it } from "vitest";
import { isModuleUnlocked, moduleDefinitions } from "./catalog";

describe("module catalog", () => {
  it("keeps every module implemented and unlockable", () => {
    expect(moduleDefinitions).toHaveLength(3);

    for (const module of moduleDefinitions) {
      expect(module.status).toBe("implemented");
      expect(module.unlockIDs.length).toBeGreaterThan(0);
      expect(module.lockedHint).not.toBe("Locked");
    }
  });

  it("checks unlocks by module contract", () => {
    const motionTrail = moduleDefinitions.find((module) => module.id === "motion-trail");

    expect(motionTrail).toBeDefined();
    expect(isModuleUnlocked(motionTrail!, new Set(["trail-overlay"]))).toBe(true);
    expect(isModuleUnlocked(motionTrail!, new Set(["avatar-wireframe"]))).toBe(false);
  });
});
