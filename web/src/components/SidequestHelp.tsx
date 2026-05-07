import { HelpCircle, ListChecks, SlidersHorizontal } from "lucide-react";
import type { Challenge } from "../api/types";
import { helpForChallenge } from "../challenges/help";
import type { ChallengeSettings } from "../challenges/settings";

type Props = {
  activeChallenge: Challenge | null;
  settings: ChallengeSettings;
};

export function SidequestHelp({ activeChallenge, settings }: Props) {
  const help = helpForChallenge(activeChallenge);

  return (
    <section className="panel help-panel" aria-label="Sidequest help">
      <div className="panel-heading">
        <HelpCircle aria-hidden="true" />
        <h2>Help</h2>
      </div>
      <p>{help.goal}</p>
      <div className="help-block">
        <h3>
          <ListChecks aria-hidden="true" />
          Do this
        </h3>
        <ol>
          {help.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
      <div className="help-block">
        <h3>
          <SlidersHorizontal aria-hidden="true" />
          Watch
        </h3>
        <ul>
          {help.feedback.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      <div className="settings-impact">
        <span>Current dials</span>
        <strong>{settingsSummary(settings)}</strong>
      </div>
      <p className="unlock-reason">{help.unlockReason}</p>
    </section>
  );
}

function settingsSummary(settings: ChallengeSettings): string {
  const quality = settings.qualityGateOffset === 0 ? "default quality" : settings.qualityGateOffset < 0 ? "looser quality" : "stricter quality";
  const time = settings.timeScale === 1 ? "normal time" : settings.timeScale < 1 ? "shorter holds" : "longer holds";
  return `${quality}, ${time}`;
}
