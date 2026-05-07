import { CheckCircle2, CircleDot, LockKeyhole, Target } from "lucide-react";
import type { Challenge, Unlock } from "../api/types";

type Props = {
  challenges: Challenge[];
  activeID: string | null;
  completedIDs: Set<string>;
  unlocked: Unlock[];
  onSelect: (id: string) => void;
};

export function ChallengeRail({ challenges, activeID, completedIDs, unlocked, onSelect }: Props) {
  const unlockIDs = new Set(unlocked.map((item) => item.id));

  return (
    <section className="panel challenge-rail" aria-label="Sidequests">
      <div className="panel-heading">
        <Target aria-hidden="true" />
        <h2>Sidequests</h2>
      </div>
      <div className="challenge-list">
        {challenges.map((challenge) => {
          const active = challenge.id === activeID;
          const completed = completedIDs.has(challenge.id);
          return (
            <button
              className={`challenge-item ${active ? "is-active" : ""}`}
              key={challenge.id}
              type="button"
              onClick={() => onSelect(challenge.id)}
            >
              <span className="challenge-state">
                {completed ? <CheckCircle2 aria-hidden="true" /> : <CircleDot aria-hidden="true" />}
              </span>
              <span>
                <strong>{challenge.title}</strong>
                <small>{challenge.category}</small>
              </span>
            </button>
          );
        })}
      </div>
      <div className="unlock-list" aria-label="Unlocked modules">
        {challenges.flatMap((challenge) =>
          challenge.unlocks.map((unlock) => (
            <span className={unlockIDs.has(unlock.id) ? "unlock is-open" : "unlock"} key={unlock.id}>
              <LockKeyhole aria-hidden="true" />
              {unlock.label}
            </span>
          ))
        )}
      </div>
    </section>
  );
}
