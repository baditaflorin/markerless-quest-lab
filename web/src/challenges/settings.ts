import type { ArtMode, LandmarkDetail, ModelVariant, TargetPart } from "../pose/options";

export type ChallengeSettings = {
  artMode: ArtMode;
  landmarkDetail: LandmarkDetail;
  modelVariant: ModelVariant;
  targetPart: TargetPart;
  qualityGateOffset: number;
  timeScale: number;
  repAdjustment: number;
  sideStepSensitivity: number;
  balanceTolerance: number;
  shoulderTolerance: number;
  progressDecay: number;
  autoSyncCompletions: boolean;
};

export const defaultChallengeSettings: ChallengeSettings = {
  artMode: "neon",
  landmarkDetail: "core",
  modelVariant: "lite",
  targetPart: "full-body",
  qualityGateOffset: 0,
  timeScale: 1,
  repAdjustment: 0,
  sideStepSensitivity: 0.075,
  balanceTolerance: 0.12,
  shoulderTolerance: 0.06,
  progressDecay: 1.5,
  autoSyncCompletions: true
};

const storageKey = "markerless-quest-settings-v1";

export function loadChallengeSettings(): ChallengeSettings {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return defaultChallengeSettings;
    }
    return normalizeSettings({ ...defaultChallengeSettings, ...JSON.parse(raw) });
  } catch {
    return defaultChallengeSettings;
  }
}

export function saveChallengeSettings(settings: ChallengeSettings): void {
  window.localStorage.setItem(storageKey, JSON.stringify(settings));
}

export function normalizeSettings(settings: ChallengeSettings): ChallengeSettings {
  return {
    artMode: enumValue(settings.artMode, ["neon", "constellation", "ink", "thermal", "blueprint"], "neon"),
    landmarkDetail: enumValue(settings.landmarkDetail, ["core", "all"], "core"),
    modelVariant: enumValue(settings.modelVariant, ["lite", "full", "heavy"], "lite"),
    targetPart: enumValue(settings.targetPart, ["full-body", "hands", "feet", "upper-body", "lower-body"], "full-body"),
    qualityGateOffset: clamp(settings.qualityGateOffset, -0.2, 0.2),
    timeScale: clamp(settings.timeScale, 0.5, 1.8),
    repAdjustment: Math.round(clamp(settings.repAdjustment, -3, 5)),
    sideStepSensitivity: clamp(settings.sideStepSensitivity, 0.04, 0.18),
    balanceTolerance: clamp(settings.balanceTolerance, 0.05, 0.22),
    shoulderTolerance: clamp(settings.shoulderTolerance, 0.03, 0.14),
    progressDecay: clamp(settings.progressDecay, 0, 3),
    autoSyncCompletions: Boolean(settings.autoSyncCompletions)
  };
}

function enumValue<T extends string>(value: string, allowed: T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
