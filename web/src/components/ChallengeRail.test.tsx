import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Challenge } from "../api/types";
import { ChallengeRail } from "./ChallengeRail";

const challenges: Challenge[] = [
  {
    id: "calibrate-frame",
    title: "Frame Calibration",
    category: "calibration",
    mechanic: "hold-visible",
    description: "Stand in frame.",
    targetSeconds: 8,
    minimumScore: 0.72,
    minimumVisibility: 0.68,
    cues: ["Keep body visible."],
    unlocks: [{ id: "trail-overlay", label: "Motion trail overlay", kind: "visual" }]
  },
  {
    id: "mirror-squat",
    title: "Mirror Squat",
    category: "movement",
    mechanic: "squat-reps",
    description: "Complete squats.",
    targetReps: 5,
    minimumScore: 0.76,
    minimumVisibility: 0.64,
    cues: ["Keep knees visible."],
    unlocks: [{ id: "avatar-wireframe", label: "Wireframe avatar", kind: "avatar" }]
  }
];

describe("ChallengeRail", () => {
  it("renders sidequests and selects one", async () => {
    const onSelect = vi.fn();
    render(
      <ChallengeRail
        activeID="calibrate-frame"
        challenges={challenges}
        completedIDs={new Set(["calibrate-frame"])}
        unlocked={[{ id: "trail-overlay", label: "Motion trail overlay", kind: "visual" }]}
        onSelect={onSelect}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /mirror squat/i }));

    expect(screen.getByText("Motion trail overlay")).toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledWith("mirror-squat");
  });
});
