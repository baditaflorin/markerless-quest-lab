import type { Challenge } from "../api/types";

export type ChallengeHelp = {
  goal: string;
  steps: string[];
  feedback: string[];
  unlockReason: string;
};

const fallback: ChallengeHelp = {
  goal: "Complete the live objective while the tracker keeps a stable pose lock.",
  steps: ["Start the camera.", "Follow the live objective meter.", "Stay visible until the module unlocks."],
  feedback: ["Green objective bars mean that part is ready.", "If score drops, step back and improve lighting."],
  unlockReason: "This proves the tracker can read your movement well enough for the next module."
};

const helpByMechanic: Record<string, ChallengeHelp> = {
  "hold-visible": {
    goal: "Teach the tracker what a clean full-body capture looks like.",
    steps: [
      "Stand far enough back that head, shoulders, hips, knees, and feet are inside the frame.",
      "Face the camera and keep your arms slightly away from your torso.",
      "Hold still until the live Hold, Score, and Visibility bars fill."
    ],
    feedback: [
      "If visibility is low, improve lighting or move away from the camera.",
      "If the hold bar drains, the tracker lost enough landmarks to pause the timer."
    ],
    unlockReason: "A stable full-body lock unlocks the motion trail, because the app can now draw where your body travels."
  },
  "squat-reps": {
    goal: "Show controlled up/down movement while knees and hips stay visible.",
    steps: [
      "Start standing tall with your feet planted.",
      "Lower slowly until your hips move closer to knee height.",
      "Stand back up cleanly; each down-to-up cycle adds one rep."
    ],
    feedback: [
      "Keep both knees visible; occluded knees make reps unreliable.",
      "Move slower if reps do not count, because the tracker needs to see both phases."
    ],
    unlockReason: "Clean repeated motion unlocks the wireframe avatar, which mirrors pose changes as a playable body rig."
  },
  "balance-hold": {
    goal: "Hold a centered, low-jitter pose with level shoulders.",
    steps: [
      "Stand in the center lane.",
      "Keep your shoulders level and your hips close to the center line.",
      "Hold until the timer fills without drifting out of the lane."
    ],
    feedback: [
      "If the hold bar drains, recenter your hips first.",
      "Relax your shoulders; a large shoulder tilt fails the balance gate."
    ],
    unlockReason: "Balance quality unlocks precision export because the session is stable enough to produce useful summary data."
  },
  "hands-up-hold": {
    goal: "Send a clear overhead gesture signal.",
    steps: [
      "Raise both wrists above your head.",
      "Keep your shoulders visible while holding the gesture.",
      "Hold until the signal timer fills."
    ],
    feedback: [
      "If it does not trigger, raise both hands higher than your nose line.",
      "Avoid stepping too close; wrists can leave the frame above you."
    ],
    unlockReason: "This unlocks a gesture effect and proves the app can react to intentional pose commands."
  },
  "side-steps": {
    goal: "Move left and right across the capture lane to charge the meter.",
    steps: [
      "Start centered so the app can learn your baseline.",
      "Step clearly to one side, then cross to the other side.",
      "Each left/right side hit charges the objective."
    ],
    feedback: [
      "Use the side-step sensitivity setting if your room is small.",
      "Keep your full body visible while shifting; walking out of frame stops scoring."
    ],
    unlockReason: "Lateral movement unlocks the lane spark overlay because the app has enough motion path data to make movement feel game-like."
  }
};

export function helpForChallenge(challenge: Challenge | null): ChallengeHelp {
  if (!challenge) {
    return fallback;
  }
  return helpByMechanic[challenge.mechanic] ?? fallback;
}
