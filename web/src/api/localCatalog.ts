import type { Challenge } from "./types";

export const localChallenges: Challenge[] = [
  {
    id: "calibrate-frame",
    title: "Frame Calibration",
    category: "calibration",
    mechanic: "hold-visible",
    description: "Stand in frame until landmarks are stable and visible.",
    targetSeconds: 8,
    minimumScore: 0.72,
    minimumVisibility: 0.68,
    cues: [
      "Keep head, shoulders, hips, knees, and ankles visible.",
      "Step back until the full body outline is inside the capture lane."
    ],
    unlocks: [{ id: "trail-overlay", label: "Motion trail overlay", kind: "visual" }]
  },
  {
    id: "mirror-squat",
    title: "Mirror Squat",
    category: "movement",
    mechanic: "squat-reps",
    description: "Complete controlled squats while keeping both knees tracked.",
    targetReps: 5,
    minimumScore: 0.76,
    minimumVisibility: 0.64,
    cues: ["Keep feet planted and knees visible.", "Move slowly enough for the tracker to follow the full range."],
    unlocks: [{ id: "avatar-wireframe", label: "Wireframe avatar", kind: "avatar" }]
  },
  {
    id: "balance-beacon",
    title: "Balance Beacon",
    category: "control",
    mechanic: "balance-hold",
    description: "Hold a centered pose with low jitter for the target time.",
    targetSeconds: 12,
    minimumScore: 0.82,
    minimumVisibility: 0.7,
    cues: ["Center your hips over the guide line.", "Keep shoulders level and breathe normally."],
    unlocks: [{ id: "precision-export", label: "Precision export preview", kind: "export" }]
  },
  {
    id: "overhead-signal",
    title: "Overhead Signal",
    category: "gesture",
    mechanic: "hands-up-hold",
    description: "Raise both hands above your head and hold the signal cleanly.",
    targetSeconds: 5,
    minimumScore: 0.74,
    minimumVisibility: 0.62,
    cues: ["Lift both wrists above your nose line.", "Keep shoulders visible so the gesture can be confirmed."],
    unlocks: [{ id: "signal-burst", label: "Signal burst effect", kind: "visual" }]
  },
  {
    id: "side-step-spark",
    title: "Side Step Spark",
    category: "agility",
    mechanic: "side-steps",
    description: "Shift left and right across the capture lane to charge the spark meter.",
    targetReps: 4,
    minimumScore: 0.7,
    minimumVisibility: 0.6,
    cues: ["Move your hips clearly left and right from center.", "Keep the full body visible while changing sides."],
    unlocks: [{ id: "lane-sparks", label: "Lane spark overlay", kind: "visual" }]
  }
];

export function localChallengeByID(id: string): Challenge | undefined {
  return localChallenges.find((challenge) => challenge.id === id);
}
