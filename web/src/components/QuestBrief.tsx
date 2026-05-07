import { ClipboardCheck, ShieldCheck } from "lucide-react";
import type { Challenge } from "../api/types";
import type { PoseSnapshot } from "../pose/usePoseTracker";

type Props = {
  activeChallenge: Challenge | null;
  completed: boolean;
  lastMessage: string | null;
  snapshot: PoseSnapshot;
};

export function QuestBrief({ activeChallenge, completed, lastMessage, snapshot }: Props) {
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

  const scoreReady = snapshot.score >= activeChallenge.minimumScore;
  const visibilityReady = snapshot.visibility >= activeChallenge.minimumVisibility;
  const repsReady = !activeChallenge.targetReps || snapshot.reps >= activeChallenge.targetReps;
  const timeReady = !activeChallenge.targetSeconds || snapshot.durationSeconds >= activeChallenge.targetSeconds;

  return (
    <section className="panel quest-brief" aria-label="Quest brief">
      <div className="panel-heading">
        <ClipboardCheck aria-hidden="true" />
        <h2>Quest Brief</h2>
      </div>
      <p>{activeChallenge.description}</p>
      <div className="requirement-grid">
        <Requirement label="Score" ready={scoreReady} value={`${Math.round(activeChallenge.minimumScore * 100)}%`} />
        <Requirement
          label="Visibility"
          ready={visibilityReady}
          value={`${Math.round(activeChallenge.minimumVisibility * 100)}%`}
        />
        <Requirement label="Reps" ready={repsReady} value={activeChallenge.targetReps ? String(activeChallenge.targetReps) : "open"} />
        <Requirement
          label="Time"
          ready={timeReady}
          value={activeChallenge.targetSeconds ? `${activeChallenge.targetSeconds}s` : "open"}
        />
      </div>
      <div className={completed ? "quest-result is-complete" : "quest-result"}>
        <ShieldCheck aria-hidden="true" />
        <span>{lastMessage ?? (completed ? "Unlocked" : activeChallenge.cues[0])}</span>
      </div>
    </section>
  );
}

function Requirement({ label, ready, value }: { label: string; ready: boolean; value: string }) {
  return (
    <span className={ready ? "requirement is-ready" : "requirement"}>
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  );
}
