export type LandmarkLike = {
  x: number;
  y: number;
  visibility?: number;
};

export type PoseQuality = {
  score: number;
  visibility: number;
  inFrameRatio: number;
  centerX: number;
  shoulderTilt: number;
  handsAboveHead: boolean;
  handsAboveShoulders: boolean;
};

export type SquatCounterState = {
  phase: "up" | "down";
  reps: number;
};

const REQUIRED_LANDMARKS = [0, 11, 12, 23, 24, 25, 26, 27, 28];

export function scorePoseQuality(landmarks: LandmarkLike[] | undefined): PoseQuality {
  if (!landmarks || landmarks.length === 0) {
    return {
      score: 0,
      visibility: 0,
      inFrameRatio: 0,
      centerX: 0.5,
      shoulderTilt: 1,
      handsAboveHead: false,
      handsAboveShoulders: false
    };
  }

  const required = REQUIRED_LANDMARKS.map((index) => landmarks[index]).filter(Boolean);
  const visibility = average(required.map((landmark) => landmark.visibility ?? 1));
  const inFrameRatio =
    required.filter((landmark) => landmark.x >= 0.03 && landmark.x <= 0.97 && landmark.y >= 0.03 && landmark.y <= 0.97)
      .length / Math.max(required.length, 1);
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const nose = landmarks[0];
  const shoulderLine = leftShoulder && rightShoulder ? average([leftShoulder.y, rightShoulder.y]) : 0.45;
  const headLine = nose?.y ?? shoulderLine - 0.1;

  return {
    score: clamp(visibility * 0.72 + inFrameRatio * 0.28),
    visibility: clamp(visibility),
    inFrameRatio: clamp(inFrameRatio),
    centerX: clamp(average([leftHip?.x, rightHip?.x, leftShoulder?.x, rightShoulder?.x].filter(isNumber))),
    shoulderTilt: Math.abs((leftShoulder?.y ?? shoulderLine) - (rightShoulder?.y ?? shoulderLine)),
    handsAboveHead: Boolean(leftWrist && rightWrist && leftWrist.y < headLine && rightWrist.y < headLine),
    handsAboveShoulders: Boolean(leftWrist && rightWrist && leftWrist.y < shoulderLine && rightWrist.y < shoulderLine)
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

function isNumber(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
