import { z } from "zod";
import type { Challenge, ChallengeEventPayload, ProgressResponse, SessionResponse } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

const unlockSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.string()
});

const challengeSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  description: z.string(),
  targetSeconds: z.number().optional(),
  targetReps: z.number().optional(),
  minimumScore: z.number(),
  minimumVisibility: z.number(),
  cues: z.array(z.string()),
  unlocks: z.array(unlockSchema)
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
  unlocks: z.array(unlockSchema),
  recordedAt: z.string()
});

export async function fetchChallenges(): Promise<Challenge[]> {
  const response = await fetch(apiPath("/api/challenges"));
  await assertOK(response);
  return challengeListSchema.parse(await response.json()).challenges;
}

export async function createSession(): Promise<SessionResponse> {
  const response = await fetch(apiPath("/api/sessions"), { method: "POST" });
  await assertOK(response);
  return sessionSchema.parse(await response.json());
}

export async function submitChallengeEvent(
  challengeID: string,
  payload: ChallengeEventPayload
): Promise<ProgressResponse> {
  const response = await fetch(apiPath(`/api/challenges/${challengeID}/events`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  await assertOK(response);
  return progressSchema.parse(await response.json());
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
