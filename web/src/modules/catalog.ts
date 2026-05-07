export type ModuleID = "motion-trail" | "wireframe-avatar" | "precision-export";

export type ModuleDefinition = {
  id: ModuleID;
  title: string;
  unlockIDs: string[];
  unlockChallengeID: string;
  description: string;
  lockedHint: string;
  status: "implemented";
};

export const moduleDefinitions: ModuleDefinition[] = [
  {
    id: "motion-trail",
    title: "Motion Trail",
    unlockIDs: ["trail-overlay", "lane-sparks"],
    unlockChallengeID: "calibrate-frame",
    description: "Draws a live center-of-body trace over the capture stage and module preview.",
    lockedHint: "Complete Frame Calibration to prove the tracker can see your full body.",
    status: "implemented"
  },
  {
    id: "wireframe-avatar",
    title: "Wireframe Avatar",
    unlockIDs: ["avatar-wireframe"],
    unlockChallengeID: "mirror-squat",
    description: "Mirrors pose quality, shoulder tilt, center line, and hand height as a simplified playable rig.",
    lockedHint: "Complete Mirror Squat to unlock the live avatar rig.",
    status: "implemented"
  },
  {
    id: "precision-export",
    title: "Precision Export",
    unlockIDs: ["precision-export"],
    unlockChallengeID: "balance-beacon",
    description: "Previews and downloads a session JSON summary with challenge, unlock, and pose-quality data.",
    lockedHint: "Complete Balance Beacon to unlock the export preview.",
    status: "implemented"
  }
];

export function isModuleUnlocked(module: ModuleDefinition, unlockedIDs: Set<string>): boolean {
  return module.unlockIDs.some((unlockID) => unlockedIDs.has(unlockID));
}
