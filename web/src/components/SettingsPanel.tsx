import { RotateCcw, SlidersHorizontal } from "lucide-react";
import {
  defaultChallengeSettings,
  normalizeSettings,
  type ChallengeSettings
} from "../challenges/settings";

type Props = {
  settings: ChallengeSettings;
  onChange: (settings: ChallengeSettings) => void;
};

export function SettingsPanel({ settings, onChange }: Props) {
  function update<K extends keyof ChallengeSettings>(key: K, value: ChallengeSettings[K]) {
    onChange(normalizeSettings({ ...settings, [key]: value }));
  }

  return (
    <section className="panel settings-panel" aria-label="Challenge settings">
      <div className="panel-heading">
        <SlidersHorizontal aria-hidden="true" />
        <h2>Settings</h2>
        <button className="icon-only" type="button" onClick={() => onChange(defaultChallengeSettings)} title="Reset settings">
          <RotateCcw aria-hidden="true" />
        </button>
      </div>
      <Dial
        label="Quality gate"
        max={20}
        min={-20}
        step={1}
        value={Math.round(settings.qualityGateOffset * 100)}
        valueLabel={`${Math.round(settings.qualityGateOffset * 100)}%`}
        onChange={(value) => update("qualityGateOffset", value / 100)}
      />
      <Dial
        label="Hold time"
        max={180}
        min={50}
        step={5}
        value={Math.round(settings.timeScale * 100)}
        valueLabel={`${Math.round(settings.timeScale * 100)}%`}
        onChange={(value) => update("timeScale", value / 100)}
      />
      <Dial
        label="Rep target"
        max={5}
        min={-3}
        step={1}
        value={settings.repAdjustment}
        valueLabel={settings.repAdjustment > 0 ? `+${settings.repAdjustment}` : String(settings.repAdjustment)}
        onChange={(value) => update("repAdjustment", value)}
      />
      <Dial
        label="Side-step sensitivity"
        max={18}
        min={4}
        step={1}
        value={Math.round(settings.sideStepSensitivity * 100)}
        valueLabel={`${Math.round(settings.sideStepSensitivity * 100)}%`}
        onChange={(value) => update("sideStepSensitivity", value / 100)}
      />
      <Dial
        label="Balance lane"
        max={22}
        min={5}
        step={1}
        value={Math.round(settings.balanceTolerance * 100)}
        valueLabel={`${Math.round(settings.balanceTolerance * 100)}%`}
        onChange={(value) => update("balanceTolerance", value / 100)}
      />
      <Dial
        label="Shoulder tolerance"
        max={14}
        min={3}
        step={1}
        value={Math.round(settings.shoulderTolerance * 100)}
        valueLabel={`${Math.round(settings.shoulderTolerance * 100)}%`}
        onChange={(value) => update("shoulderTolerance", value / 100)}
      />
      <Dial
        label="Decay"
        max={300}
        min={0}
        step={25}
        value={Math.round(settings.progressDecay * 100)}
        valueLabel={`${Math.round(settings.progressDecay * 100)}%`}
        onChange={(value) => update("progressDecay", value / 100)}
      />
      <label className="toggle-row">
        <input
          checked={settings.autoSyncCompletions}
          onChange={(event) => update("autoSyncCompletions", event.target.checked)}
          type="checkbox"
        />
        <span>Auto-sync completions</span>
      </label>
    </section>
  );
}

function Dial({
  label,
  max,
  min,
  onChange,
  step,
  value,
  valueLabel
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
  valueLabel: string;
}) {
  return (
    <label className="dial">
      <span>
        {label}
        <strong>{valueLabel}</strong>
      </span>
      <input max={max} min={min} onChange={(event) => onChange(Number(event.target.value))} step={step} type="range" value={value} />
    </label>
  );
}
