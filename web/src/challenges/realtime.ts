import type { Challenge } from "../api/types";
import type { PoseSnapshot } from "../pose/usePoseTracker";
import { defaultChallengeSettings, type ChallengeSettings } from "./settings";

export type ObjectiveState = {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  progress: number;
  ready: boolean;
};

export type RealtimeChallengeState = {
  challengeID: string | null;
  lastTimestampMs: number;
  holdSeconds: number;
  sideReps: number;
  lastSide: "left" | "right" | "center";
  baselineX: number;
  completed: boolean;
  score: number;
  visibility: number;
  reps: number;
  durationSeconds: number;
  progress: number;
  message: string;
  objectives: ObjectiveState[];
};

export function initialRealtimeState(challengeID: string | null = null): RealtimeChallengeState {
  return {
    challengeID,
    lastTimestampMs: 0,
    holdSeconds: 0,
    sideReps: 0,
    lastSide: "center",
    baselineX: 0.5,
    completed: false,
    score: 0,
    visibility: 0,
    reps: 0,
    durationSeconds: 0,
    progress: 0,
    message: "Start capture to begin the live sidequest.",
    objectives: []
  };
}

export function updateRealtimeChallenge(
  challenge: Challenge | null,
  snapshot: PoseSnapshot,
  previous: RealtimeChallengeState,
  settings: ChallengeSettings = defaultChallengeSettings
): RealtimeChallengeState {
  if (!challenge) {
    return initialRealtimeState(null);
  }

  const reset = previous.challengeID !== challenge.id;
  const base = reset ? initialRealtimeState(challenge.id) : previous;
  const deltaSeconds = reset || base.lastTimestampMs === 0 ? 0 : clamp((snapshot.capturedAtMs - base.lastTimestampMs) / 1000, 0, 1);
  const baselineX = reset && snapshot.hasPose ? snapshot.centerX : base.baselineX;
  const minimumScore = effectiveQualityTarget(challenge.minimumScore, settings);
  const minimumVisibility = effectiveQualityTarget(challenge.minimumVisibility, settings);
  const qualityReady =
    snapshot.hasPose && snapshot.score >= minimumScore && snapshot.visibility >= minimumVisibility;

  switch (challenge.mechanic) {
    case "squat-reps":
      return buildRepState(challenge, snapshot, base, qualityReady, settings, minimumScore, minimumVisibility);
    case "balance-hold":
      return buildHoldState(
        challenge,
        snapshot,
        base,
        deltaSeconds,
        settings,
        minimumScore,
        minimumVisibility,
        qualityReady && Math.abs(snapshot.centerX - 0.5) <= settings.balanceTolerance && snapshot.shoulderTilt <= settings.shoulderTolerance,
        "Balance locked",
        "Center and level your shoulders"
      );
    case "hands-up-hold":
      return buildHoldState(
        challenge,
        snapshot,
        base,
        deltaSeconds,
        settings,
        minimumScore,
        minimumVisibility,
        qualityReady && snapshot.handsAboveHead,
        "Signal held",
        "Raise both hands above your head"
      );
    case "side-steps":
      return buildSideStepState(challenge, snapshot, base, deltaSeconds, baselineX, qualityReady, settings, minimumScore, minimumVisibility);
    case "hold-visible":
    default:
      return buildHoldState(
        challenge,
        snapshot,
        base,
        deltaSeconds,
        settings,
        minimumScore,
        minimumVisibility,
        qualityReady && snapshot.inFrameRatio >= 0.9,
        "Tracking stable",
        "Keep the full body visible"
      );
  }
}

function buildHoldState(
  challenge: Challenge,
  snapshot: PoseSnapshot,
  previous: RealtimeChallengeState,
  deltaSeconds: number,
  settings: ChallengeSettings,
  minimumScore: number,
  minimumVisibility: number,
  condition: boolean,
  readyMessage: string,
  waitingMessage: string
): RealtimeChallengeState {
  const target = effectiveSecondsTarget(challenge, settings);
  const holdSeconds = condition
    ? previous.holdSeconds + deltaSeconds
    : Math.max(0, previous.holdSeconds - deltaSeconds * settings.progressDecay);
  const completed = holdSeconds >= target;
  const objective = objectiveState("hold", "Hold", holdSeconds, target, "s");

  return {
    ...previous,
    challengeID: challenge.id,
    lastTimestampMs: snapshot.capturedAtMs,
    holdSeconds,
    completed,
    score: snapshot.score,
    visibility: snapshot.visibility,
    reps: snapshot.reps,
    durationSeconds: Math.floor(holdSeconds),
    progress: objective.progress,
    message: completed ? "Unlocked automatically." : condition ? readyMessage : waitingMessage,
    objectives: [
      objective,
      objectiveState("score", "Score", snapshot.score, minimumScore, "%"),
      objectiveState("visibility", "Visibility", snapshot.visibility, minimumVisibility, "%")
    ]
  };
}

function buildRepState(
  challenge: Challenge,
  snapshot: PoseSnapshot,
  previous: RealtimeChallengeState,
  qualityReady: boolean,
  settings: ChallengeSettings,
  minimumScore: number,
  minimumVisibility: number
): RealtimeChallengeState {
  const target = effectiveRepTarget(challenge, settings);
  const completed = qualityReady && snapshot.reps >= target;

  return {
    ...previous,
    challengeID: challenge.id,
    lastTimestampMs: snapshot.capturedAtMs,
    completed,
    score: snapshot.score,
    visibility: snapshot.visibility,
    reps: snapshot.reps,
    durationSeconds: snapshot.durationSeconds,
    progress: clamp(snapshot.reps / target, 0, 1),
    message: completed ? "Unlocked automatically." : "Clean squat reps charge this sidequest.",
    objectives: [
      objectiveState("reps", "Reps", snapshot.reps, target, ""),
      objectiveState("score", "Score", snapshot.score, minimumScore, "%"),
      objectiveState("visibility", "Visibility", snapshot.visibility, minimumVisibility, "%")
    ]
  };
}

function buildSideStepState(
  challenge: Challenge,
  snapshot: PoseSnapshot,
  previous: RealtimeChallengeState,
  deltaSeconds: number,
  baselineX: number,
  qualityReady: boolean,
  settings: ChallengeSettings,
  minimumScore: number,
  minimumVisibility: number
): RealtimeChallengeState {
  const side = sideFromCenter(snapshot.centerX, baselineX, settings.sideStepSensitivity);
  const sideReps =
    qualityReady && side !== "center" && side !== previous.lastSide ? previous.sideReps + 1 : previous.sideReps;
  const target = effectiveRepTarget(challenge, settings);
  const completed = qualityReady && sideReps >= target;

  return {
    ...previous,
    challengeID: challenge.id,
    lastTimestampMs: snapshot.capturedAtMs,
    baselineX,
    lastSide: side === "center" && deltaSeconds > 0 ? previous.lastSide : side,
    sideReps,
    completed,
    score: snapshot.score,
    visibility: snapshot.visibility,
    reps: sideReps,
    durationSeconds: snapshot.durationSeconds,
    progress: clamp(sideReps / target, 0, 1),
    message: completed ? "Unlocked automatically." : "Cross the lane left and right to spark the meter.",
    objectives: [
      objectiveState("steps", "Side hits", sideReps, target, ""),
      objectiveState("score", "Score", snapshot.score, minimumScore, "%"),
      objectiveState("visibility", "Visibility", snapshot.visibility, minimumVisibility, "%")
    ]
  };
}

function sideFromCenter(centerX: number, baselineX: number, sensitivity: number): "left" | "right" | "center" {
  if (centerX < baselineX - sensitivity) {
    return "left";
  }
  if (centerX > baselineX + sensitivity) {
    return "right";
  }
  return "center";
}

function effectiveSecondsTarget(challenge: Challenge, settings: ChallengeSettings): number {
  return Math.max(1, Math.round((challenge.targetSeconds ?? 1) * settings.timeScale));
}

function effectiveRepTarget(challenge: Challenge, settings: ChallengeSettings): number {
  return Math.max(1, (challenge.targetReps ?? 1) + settings.repAdjustment);
}

function effectiveQualityTarget(value: number, settings: ChallengeSettings): number {
  return clamp(value + settings.qualityGateOffset, 0.1, 0.98);
}

function objectiveState(id: string, label: string, value: number, target: number, unit: string): ObjectiveState {
  return {
    id,
    label,
    value,
    target,
    unit,
    progress: clamp(target <= 0 ? 1 : value / target, 0, 1),
    ready: value >= target
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
