import type { LandmarkLike } from "./poseScoring";

export type ModelVariant = "lite" | "full" | "heavy";
export type LandmarkDetail = "core" | "all";
export type TargetPart = "full-body" | "hands" | "feet" | "upper-body" | "lower-body";
export type ArtMode = "neon" | "constellation" | "ink" | "thermal" | "blueprint";

export type PoseTrackerOptions = {
  artMode: ArtMode;
  landmarkDetail: LandmarkDetail;
  modelVariant: ModelVariant;
  targetPart: TargetPart;
};

export const modelAssetURLs: Record<ModelVariant, string> = {
  lite: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
  full: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task",
  heavy:
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task"
};

export const targetPartLabels: Record<TargetPart, string> = {
  "full-body": "Full body",
  hands: "Hands",
  feet: "Feet",
  "upper-body": "Upper body",
  "lower-body": "Lower body"
};

export const artModeLabels: Record<ArtMode, string> = {
  neon: "Neon trace",
  constellation: "Constellation",
  ink: "Ink echo",
  thermal: "Thermal bloom",
  blueprint: "Blueprint"
};

const landmarkGroups: Record<TargetPart, number[]> = {
  "full-body": Array.from({ length: 33 }, (_, index) => index),
  hands: [15, 16, 17, 18, 19, 20, 21, 22],
  feet: [27, 28, 29, 30, 31, 32],
  "upper-body": [0, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 23, 24],
  "lower-body": [23, 24, 25, 26, 27, 28, 29, 30, 31, 32]
};

const coreLandmarks = new Set([0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]);

export function landmarkIndexesForTarget(targetPart: TargetPart, detail: LandmarkDetail): Set<number> {
  const target = landmarkGroups[targetPart];
  if (detail === "all") {
    return new Set(target);
  }
  return new Set(target.filter((index) => coreLandmarks.has(index)));
}

export function targetVisibility(landmarks: LandmarkLike[] | undefined, targetPart: TargetPart): number {
  if (!landmarks?.length) {
    return 0;
  }
  const indexes = landmarkGroups[targetPart];
  const values = indexes.map((index) => landmarks[index]?.visibility ?? 0).filter((value) => value > 0);
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
