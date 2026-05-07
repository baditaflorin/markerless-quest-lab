import { ClipboardCheck, ShieldCheck } from "lucide-react";
import type { Challenge } from "../api/types";
import type { RealtimeChallengeState } from "../challenges/realtime";
import type { PoseSnapshot } from "../pose/usePoseTracker";

type Props = {
  activeChallenge: Challenge | null;
  completed: boolean;
  lastMessage: string | null;
  questState: RealtimeChallengeState;
  snapshot: PoseSnapshot;
};

export function QuestBrief({ activeChallenge, completed, lastMessage, questState, snapshot }: Props) {
  if (!activeChallenge) {
    return (
      <section className="panel quest-brief" aria-label="Quest brief">
        <div className="panel-heading">
          <ClipboardCheck aria-hidden="true" />
          <h2>Quest Brief</h2>
        </div>
      </section>
    );
  }

  return (
    <section className="panel quest-brief" aria-label="Quest brief">
      <div className="panel-heading">
        <ClipboardCheck aria-hidden="true" />
        <h2>Quest Brief</h2>
      </div>
      <p>{activeChallenge.description}</p>
      <div className="requirement-grid">
        {questState.objectives.map((objective) => (
          <Requirement
            key={objective.id}
            label={objective.label}
            progress={objective.progress}
            ready={objective.ready}
            value={formatObjective(objective.value, objective.unit)}
          />
        ))}
        {questState.objectives.length === 0 ? (
          <>
            <Requirement label="Score" progress={snapshot.score} ready={false} value="0%" />
            <Requirement label="Visibility" progress={snapshot.visibility} ready={false} value="0%" />
          </>
        ) : null}
      </div>
      <div className={completed ? "quest-result is-complete" : "quest-result"}>
        <ShieldCheck aria-hidden="true" />
        <span>{lastMessage ?? (completed ? "Unlocked" : activeChallenge.cues[0])}</span>
      </div>
    </section>
  );
}

function Requirement({ label, progress, ready, value }: { label: string; progress: number; ready: boolean; value: string }) {
  return (
    <span className={ready ? "requirement is-ready" : "requirement"}>
      <small>{label}</small>
      <strong>{value}</strong>
      <i style={{ width: `${progress * 100}%` }} />
    </span>
  );
}

function formatObjective(value: number, unit: string): string {
  if (unit === "%") {
    return `${Math.round(value * 100)}%`;
  }
  if (unit === "s") {
    return `${Math.floor(value)}s`;
  }
  return String(Math.floor(value));
}
