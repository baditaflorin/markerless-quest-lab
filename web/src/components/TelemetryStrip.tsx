import { Activity, Gauge, Timer, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import type { PoseSnapshot } from "../pose/usePoseTracker";

type Props = {
  snapshot: PoseSnapshot;
};

export function TelemetryStrip({ snapshot }: Props) {
  return (
    <section className="telemetry-strip" aria-label="Pose telemetry">
      <Metric icon={<Gauge aria-hidden="true" />} label="Score" value={`${Math.round(snapshot.score * 100)}%`} />
      <Metric icon={<Activity aria-hidden="true" />} label="Visibility" value={`${Math.round(snapshot.visibility * 100)}%`} />
      <Metric icon={<Trophy aria-hidden="true" />} label="Reps" value={String(snapshot.reps)} />
      <Metric icon={<Timer aria-hidden="true" />} label="Time" value={`${snapshot.durationSeconds}s`} />
    </section>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="metric">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
