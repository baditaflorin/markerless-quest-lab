export type LandmarkLike = {
  x: number;
  y: number;
  visibility?: number;
};

export type PoseQuality = {
  score: number;
  visibility: number;
  inFrameRatio: number;
};

export type SquatCounterState = {
  phase: "up" | "down";
  reps: number;
};

const REQUIRED_LANDMARKS = [0, 11, 12, 23, 24, 25, 26, 27, 28];

export function scorePoseQuality(landmarks: LandmarkLike[] | undefined): PoseQuality {
  if (!landmarks || landmarks.length === 0) {
    return { score: 0, visibility: 0, inFrameRatio: 0 };
  }

  const required = REQUIRED_LANDMARKS.map((index) => landmarks[index]).filter(Boolean);
  const visibility = average(required.map((landmark) => landmark.visibility ?? 1));
  const inFrameRatio =
    required.filter((landmark) => landmark.x >= 0.03 && landmark.x <= 0.97 && landmark.y >= 0.03 && landmark.y <= 0.97)
      .length / Math.max(required.length, 1);

  return {
    score: clamp(visibility * 0.72 + inFrameRatio * 0.28),
    visibility: clamp(visibility),
    inFrameRatio: clamp(inFrameRatio)
  };
}

export function updateSquatCounter(
  landmarks: LandmarkLike[] | undefined,
  state: SquatCounterState
): SquatCounterState {
  const phase = estimateSquatPhase(landmarks);
  if (!phase) {
    return state;
  }
  if (state.phase === "up" && phase === "down") {
    return { ...state, phase: "down" };
  }
  if (state.phase === "down" && phase === "up") {
    return { phase: "up", reps: state.reps + 1 };
  }
  return { ...state, phase };
}

export function estimateSquatPhase(landmarks: LandmarkLike[] | undefined): "up" | "down" | null {
  if (!landmarks?.[23] || !landmarks?.[24] || !landmarks?.[25] || !landmarks?.[26]) {
    return null;
  }

  const hipY = average([landmarks[23].y, landmarks[24].y]);
  const kneeY = average([landmarks[25].y, landmarks[26].y]);
  const hipToKnee = hipY - kneeY;

  return hipToKnee > -0.14 ? "down" : "up";
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
