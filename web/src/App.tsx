import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Server } from "lucide-react";
import { createSession, fetchChallenges, submitChallengeEvent } from "./api/client";
import type { Unlock } from "./api/types";
import { CaptureStage } from "./components/CaptureStage";
import { ChallengeRail } from "./components/ChallengeRail";
import { QuestBrief } from "./components/QuestBrief";
import { TelemetryStrip } from "./components/TelemetryStrip";
import { usePoseTracker } from "./pose/usePoseTracker";

export default function App() {
  const { data: challenges = [], isLoading, error } = useQuery({ queryKey: ["challenges"], queryFn: fetchChallenges });
  const [activeID, setActiveID] = useState<string | null>(null);
  const [sessionID, setSessionID] = useState<string | null>(null);
  const [completedIDs, setCompletedIDs] = useState<Set<string>>(new Set());
  const [unlocked, setUnlocked] = useState<Unlock[]>([]);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const tracker = usePoseTracker();

  useEffect(() => {
    if (!activeID && challenges.length > 0) {
      setActiveID(challenges[0].id);
    }
  }, [activeID, challenges]);

  const activeChallenge = useMemo(
    () => challenges.find((challenge) => challenge.id === activeID) ?? challenges[0] ?? null,
    [activeID, challenges]
  );

  const eventMutation = useMutation({
    mutationFn: async () => {
      if (!activeChallenge) {
        throw new Error("No active sidequest selected.");
      }
      const session = sessionID ?? (await createSession()).sessionId;
      setSessionID(session);
      return submitChallengeEvent(activeChallenge.id, {
        sessionId: session,
        eventType: "completion",
        score: tracker.snapshot.score,
        visibility: tracker.snapshot.visibility,
        reps: tracker.snapshot.reps,
        durationSeconds: tracker.snapshot.durationSeconds,
        clientTimestamp: new Date().toISOString()
      });
    },
    onSuccess: (progress) => {
      setLastMessage(progress.message);
      if (progress.completed) {
        setCompletedIDs((current) => new Set([...current, progress.challengeId]));
        setUnlocked((current) => {
          const seen = new Set(current.map((unlock) => unlock.id));
          return [...current, ...progress.unlocks.filter((unlock) => !seen.has(unlock.id))];
        });
      }
    }
  });

  async function handleStart() {
    const session = sessionID ?? (await createSession()).sessionId;
    setSessionID(session);
    await tracker.start();
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <span className="brand-mark">MQ</span>
          <span>
            <strong>Markerless Quest Lab</strong>
            <small>webcam mocap console</small>
          </span>
        </div>
        <div className="session-chip" title="Current capture session">
          <Server aria-hidden="true" />
          <span>{sessionID ? sessionID.slice(0, 8) : "no session"}</span>
        </div>
        {isLoading ? <div className="panel skeleton" /> : null}
        {error ? (
          <div className="panel error-panel" role="alert">
            <AlertTriangle aria-hidden="true" />
            <span>{error instanceof Error ? error.message : "Challenge API unavailable."}</span>
          </div>
        ) : null}
        <ChallengeRail
          activeID={activeChallenge?.id ?? null}
          challenges={challenges}
          completedIDs={completedIDs}
          unlocked={unlocked}
          onSelect={setActiveID}
        />
      </aside>

      <section className="workspace">
        <CaptureStage
          activeChallenge={activeChallenge}
          canvasRef={tracker.canvasRef}
          error={tracker.error ?? (eventMutation.error instanceof Error ? eventMutation.error.message : null)}
          onStart={handleStart}
          onStop={tracker.stop}
          onSubmit={() => eventMutation.mutate()}
          snapshot={tracker.snapshot}
          status={tracker.status}
          submitting={eventMutation.isPending}
          videoRef={tracker.videoRef}
        />
        <TelemetryStrip snapshot={tracker.snapshot} />
      </section>

      <aside className="rightbar">
        <QuestBrief
          activeChallenge={activeChallenge}
          completed={activeChallenge ? completedIDs.has(activeChallenge.id) : false}
          lastMessage={lastMessage}
          snapshot={tracker.snapshot}
        />
        <section className="panel cue-panel" aria-label="Movement cues">
          <h2>Cues</h2>
          <ul>
            {(activeChallenge?.cues ?? []).map((cue) => (
              <li key={cue}>{cue}</li>
            ))}
          </ul>
        </section>
      </aside>

    </main>
  );
}
