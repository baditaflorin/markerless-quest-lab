import { z } from "zod";
import type { Challenge, ChallengeEventPayload, ProgressResponse, SessionResponse } from "./types";
import { localChallengeByID, localChallenges } from "./localCatalog";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const FORCE_STATIC = import.meta.env.VITE_STATIC_DEMO === "true";

const unlockSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.string()
});

const challengeSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  mechanic: z.string().default("hold-visible"),
  description: z.string(),
  targetSeconds: z.number().optional(),
  targetReps: z.number().optional(),
  minimumScore: z.number(),
  minimumVisibility: z.number(),
  cues: z.array(z.string()),
  unlocks: z.array(unlockSchema).default([])
});

const challengeListSchema = z.object({
  challenges: z.array(challengeSchema)
});

const sessionSchema = z.object({
  sessionId: z.string(),
  createdAt: z.string()
});

const progressSchema = z.object({
  sessionId: z.string(),
  challengeId: z.string(),
  completed: z.boolean(),
  score: z.number(),
  visibility: z.number(),
  message: z.string(),
  unlocks: z.array(unlockSchema).nullish().transform((value) => value ?? []),
  recordedAt: z.string()
});

export async function fetchChallenges(): Promise<Challenge[]> {
  if (isStaticDemo()) {
    return localChallenges;
  }
  const response = await fetch(apiPath("/api/challenges"));
  await assertOK(response);
  return challengeListSchema.parse(await response.json()).challenges;
}

export async function createSession(): Promise<SessionResponse> {
  if (isStaticDemo()) {
    return localSession();
  }
  const response = await fetch(apiPath("/api/sessions"), { method: "POST" });
  await assertOK(response);
  return sessionSchema.parse(await response.json());
}

export async function submitChallengeEvent(
  challengeID: string,
  payload: ChallengeEventPayload
): Promise<ProgressResponse> {
  if (isStaticDemo()) {
    return localProgress(challengeID, payload);
  }
  const response = await fetch(apiPath(`/api/challenges/${challengeID}/events`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  await assertOK(response);
  return progressSchema.parse(await response.json());
}

export function isStaticDemo(): boolean {
  return FORCE_STATIC || window.location.hostname.endsWith("github.io") || new URLSearchParams(window.location.search).has("demo");
}

function apiPath(path: string): string {
  return `${API_BASE_URL}${path}`;
}

async function assertOK(response: Response): Promise<void> {
  if (response.ok) {
    return;
  }
  let message = `Request failed with status ${response.status}`;
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) {
      message = body.message;
    }
  } catch {
    // Keep the status-based message when the server did not return JSON.
  }
  throw new Error(message);
}

function localSession(): SessionResponse {
  return {
    sessionId: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
}

function localProgress(challengeID: string, payload: ChallengeEventPayload): ProgressResponse {
  const challenge = localChallengeByID(challengeID);
  const completed =
    Boolean(challenge) &&
    payload.score >= (challenge?.minimumScore ?? 1) &&
    payload.visibility >= (challenge?.minimumVisibility ?? 1) &&
    (!challenge?.targetReps || (payload.reps ?? 0) >= challenge.targetReps) &&
    (!challenge?.targetSeconds || (payload.durationSeconds ?? 0) >= challenge.targetSeconds);

  return {
    sessionId: payload.sessionId,
    challengeId: challengeID,
    completed,
    score: payload.score,
    visibility: payload.visibility,
    message: completed ? "Sidequest complete. Unlock added to this browser session." : "Live progress saved locally.",
    unlocks: completed ? (challenge?.unlocks ?? []) : [],
    recordedAt: new Date().toISOString()
  };
}
