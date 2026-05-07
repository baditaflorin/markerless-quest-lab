import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Server } from "lucide-react";
import { createSession, fetchChallenges, isStaticDemo, submitChallengeEvent } from "./api/client";
import { localChallenges } from "./api/localCatalog";
import type { Unlock } from "./api/types";
import { initialRealtimeState, updateRealtimeChallenge } from "./challenges/realtime";
import { CaptureStage } from "./components/CaptureStage";
import { ChallengeRail } from "./components/ChallengeRail";
import { QuestBrief } from "./components/QuestBrief";
import { TelemetryStrip } from "./components/TelemetryStrip";
import { UnlockModules, type TrailPoint } from "./components/UnlockModules";
import { usePoseTracker } from "./pose/usePoseTracker";

export default function App() {
  const { data, isLoading, error } = useQuery({ queryKey: ["challenges"], queryFn: fetchChallenges });
  const challenges = data ?? localChallenges;
  const [activeID, setActiveID] = useState<string | null>(null);
  const [sessionID, setSessionID] = useState<string | null>(null);
  const [completedIDs, setCompletedIDs] = useState<Set<string>>(new Set());
  const [unlocked, setUnlocked] = useState<Unlock[]>([]);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [questState, setQuestState] = useState(initialRealtimeState());
  const [trailPoints, setTrailPoints] = useState<TrailPoint[]>([]);
  const tracker = usePoseTracker();
  const demoMode = isStaticDemo() || Boolean(error);

  useEffect(() => {
    if (!activeID && challenges.length > 0) {
      setActiveID(challenges[0].id);
    }
  }, [activeID, challenges]);

  const activeChallenge = useMemo(
    () => challenges.find((challenge) => challenge.id === activeID) ?? challenges[0] ?? null,
    [activeID, challenges]
  );

  useEffect(() => {
    setQuestState(initialRealtimeState(activeChallenge?.id ?? null));
  }, [activeChallenge?.id]);

  useEffect(() => {
    if (tracker.status !== "running" || tracker.snapshot.capturedAtMs === 0) {
      return;
    }
    setQuestState((current) => updateRealtimeChallenge(activeChallenge, tracker.snapshot, current));
    if (tracker.snapshot.hasPose) {
      setTrailPoints((current) => [
        {
          id: tracker.snapshot.capturedAtMs,
          x: tracker.snapshot.centerX * 100,
          y: tracker.snapshot.handsAboveHead ? 32 : tracker.snapshot.handsAboveShoulders ? 42 : 56,
          strength: tracker.snapshot.score
        },
        ...current.slice(0, 28)
      ]);
    }
  }, [activeChallenge, tracker.snapshot, tracker.status]);

  const eventMutation = useMutation({
    mutationFn: async (eventType: "progress" | "completion") => {
      if (!activeChallenge) {
        throw new Error("No active sidequest selected.");
      }
      const session = sessionID ?? (await createSession()).sessionId;
      setSessionID(session);
      return submitChallengeEvent(activeChallenge.id, {
        sessionId: session,
        eventType,
        score: questState.score,
        visibility: questState.visibility,
        reps: questState.reps,
        durationSeconds: questState.durationSeconds,
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

  useEffect(() => {
    if (!activeChallenge || !questState.completed || completedIDs.has(activeChallenge.id) || eventMutation.isPending) {
      return;
    }
    eventMutation.mutate("completion");
  }, [activeChallenge, completedIDs, eventMutation, questState.completed]);

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
          <span>{demoMode ? "browser demo" : sessionID ? sessionID.slice(0, 8) : "no session"}</span>
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
          onSubmit={() => eventMutation.mutate("progress")}
          questState={questState}
          snapshot={tracker.snapshot}
          status={tracker.status}
          submitting={eventMutation.isPending}
          trailEnabled={unlocked.some((item) => item.id === "trail-overlay" || item.id === "lane-sparks")}
          trailPoints={trailPoints}
          videoRef={tracker.videoRef}
        />
        <TelemetryStrip snapshot={tracker.snapshot} />
      </section>

      <aside className="rightbar">
        <QuestBrief
          activeChallenge={activeChallenge}
          completed={activeChallenge ? completedIDs.has(activeChallenge.id) : false}
          lastMessage={lastMessage}
          questState={questState}
          snapshot={tracker.snapshot}
        />
        <UnlockModules
          activeChallenge={activeChallenge}
          completedIDs={completedIDs}
          questState={questState}
          sessionID={sessionID}
          snapshot={tracker.snapshot}
          trailPoints={trailPoints}
          unlocked={unlocked}
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
