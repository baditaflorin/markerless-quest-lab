export type Unlock = {
  id: string;
  label: string;
  kind: string;
};

export type Challenge = {
  id: string;
  title: string;
  category: string;
  mechanic: string;
  description: string;
  targetSeconds?: number;
  targetReps?: number;
  minimumScore: number;
  minimumVisibility: number;
  cues: string[];
  unlocks: Unlock[];
};

export type SessionResponse = {
  sessionId: string;
  createdAt: string;
};

export type ChallengeEventPayload = {
  sessionId: string;
  eventType: "progress" | "completion";
  score: number;
  visibility: number;
  reps?: number;
  durationSeconds?: number;
  clientTimestamp: string;
};

export type ProgressResponse = {
  sessionId: string;
  challengeId: string;
  completed: boolean;
  score: number;
  visibility: number;
  message: string;
  unlocks: Unlock[];
  recordedAt: string;
};
