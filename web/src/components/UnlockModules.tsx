import { Download, FileJson, LockKeyhole, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { Challenge, Unlock } from "../api/types";
import type { RealtimeChallengeState } from "../challenges/realtime";
import { isModuleUnlocked, moduleDefinitions, type ModuleDefinition } from "../modules/catalog";
import type { PoseSnapshot } from "../pose/usePoseTracker";

export type TrailPoint = {
  id: number;
  x: number;
  y: number;
  strength: number;
};

type Props = {
  activeChallenge: Challenge | null;
  completedIDs: Set<string>;
  sessionID: string | null;
  snapshot: PoseSnapshot;
  trailPoints: TrailPoint[];
  unlocked: Unlock[];
  questState: RealtimeChallengeState;
};

export function UnlockModules({
  activeChallenge,
  completedIDs,
  sessionID,
  snapshot,
  trailPoints,
  unlocked,
  questState
}: Props) {
  const unlockedIDs = new Set(unlocked.map((item) => item.id));
  const exportPayload = {
    sessionId: sessionID,
    activeChallengeId: activeChallenge?.id ?? null,
    completedChallengeIds: Array.from(completedIDs),
    unlocked,
    currentPose: {
      score: round(snapshot.score),
      visibility: round(snapshot.visibility),
      centerX: round(snapshot.centerX),
      reps: questState.reps,
      durationSeconds: questState.durationSeconds
    },
    generatedAt: new Date().toISOString()
  };

  return (
    <section className="panel modules-panel" aria-label="Unlocked modules">
      <div className="panel-heading">
        <Sparkles aria-hidden="true" />
        <h2>Modules</h2>
      </div>
      {moduleDefinitions.map((module) => (
        <Module definition={module} key={module.id} unlocked={isModuleUnlocked(module, unlockedIDs)}>
          {module.id === "motion-trail" ? <MotionTrailPreview trailPoints={trailPoints} /> : null}
          {module.id === "wireframe-avatar" ? <WireframeAvatar snapshot={snapshot} /> : null}
          {module.id === "precision-export" ? <PrecisionExportPreview payload={exportPayload} /> : null}
        </Module>
      ))}
    </section>
  );
}

function Module({ children, definition, unlocked }: { children: ReactNode; definition: ModuleDefinition; unlocked: boolean }) {
  return (
    <div className={unlocked ? "module is-open" : "module"}>
      <div className="module-title">
        {unlocked ? <Sparkles aria-hidden="true" /> : <LockKeyhole aria-hidden="true" />}
        <strong>{definition.title}</strong>
      </div>
      <p>{definition.description}</p>
      {unlocked ? children : <span className="locked-copy">{definition.lockedHint}</span>}
    </div>
  );
}

function MotionTrailPreview({ trailPoints }: { trailPoints: TrailPoint[] }) {
  return (
    <div className="trail-preview" aria-label="Motion trail overlay preview">
      {trailPoints.map((point, index) => (
        <span
          className="trail-dot"
          key={point.id}
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            opacity: Math.max(0.18, 1 - index / 24),
            transform: `scale(${0.7 + point.strength * 0.8})`
          }}
        />
      ))}
    </div>
  );
}

function WireframeAvatar({ snapshot }: { snapshot: PoseSnapshot }) {
  const center = 50 + (snapshot.centerX - 0.5) * 42;
  const handY = snapshot.handsAboveShoulders ? 20 : 46;
  const shoulderY = 42 + snapshot.shoulderTilt * 70;

  return (
    <svg className="avatar-wireframe" viewBox="0 0 100 120" role="img" aria-label="Live wireframe avatar">
      <circle cx={center} cy="16" r="8" />
      <line x1={center} y1="26" x2={center} y2="70" />
      <line x1={center - 20} y1={shoulderY} x2={center + 20} y2={42 - snapshot.shoulderTilt * 70} />
      <line x1={center - 20} y1={shoulderY} x2={center - 30} y2={handY} />
      <line x1={center + 20} y1={42 - snapshot.shoulderTilt * 70} x2={center + 30} y2={handY} />
      <line x1={center} y1="70" x2={center - 18} y2="104" />
      <line x1={center} y1="70" x2={center + 18} y2="104" />
      <circle cx={center - 30} cy={handY} r="3" />
      <circle cx={center + 30} cy={handY} r="3" />
      <circle cx={center - 18} cy="104" r="3" />
      <circle cx={center + 18} cy="104" r="3" />
    </svg>
  );
}

function PrecisionExportPreview({ payload }: { payload: unknown }) {
  return (
    <div className="export-preview">
      <FileJson aria-hidden="true" />
      <pre>{JSON.stringify(payload, null, 2)}</pre>
      <button className="icon-button compact" type="button" onClick={() => downloadExport(payload)}>
        <Download aria-hidden="true" />
        <span>Export</span>
      </button>
    </div>
  );
}

function downloadExport(payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "markerless-quest-session.json";
  link.click();
  URL.revokeObjectURL(url);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
