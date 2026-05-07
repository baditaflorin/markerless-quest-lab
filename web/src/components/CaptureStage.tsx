import { Camera, CircleStop, LoaderCircle, RadioTower, SendHorizontal } from "lucide-react";
import type { RefObject } from "react";
import type { Challenge } from "../api/types";
import type { RealtimeChallengeState } from "../challenges/realtime";
import type { TrailPoint } from "./UnlockModules";
import type { PoseSnapshot, TrackerStatus } from "../pose/usePoseTracker";

type Props = {
  activeChallenge: Challenge | null;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onSubmit: () => void;
  questState: RealtimeChallengeState;
  snapshot: PoseSnapshot;
  status: TrackerStatus;
  submitting: boolean;
  trailEnabled: boolean;
  trailPoints: TrailPoint[];
  videoRef: RefObject<HTMLVideoElement | null>;
};

export function CaptureStage({
  activeChallenge,
  canvasRef,
  error,
  onStart,
  onStop,
  onSubmit,
  questState,
  snapshot,
  status,
  submitting,
  trailEnabled,
  trailPoints,
  videoRef
}: Props) {
  const ready = status === "running" && snapshot.hasPose;

  return (
    <section className="capture-shell" aria-label="Capture stage">
      <div className="stage-toolbar">
        <div>
          <p className="eyebrow">Live capture</p>
          <h1>{activeChallenge?.title ?? "Markerless Quest Lab"}</h1>
        </div>
        <div className="stage-actions">
          {status === "running" ? (
            <button className="icon-button danger" type="button" onClick={onStop} title="Stop camera">
              <CircleStop aria-hidden="true" />
              <span>Stop</span>
            </button>
          ) : (
            <button className="icon-button" type="button" onClick={onStart} disabled={status === "loading"} title="Start camera">
              {status === "loading" ? <LoaderCircle aria-hidden="true" className="spin" /> : <Camera aria-hidden="true" />}
              <span>Camera</span>
            </button>
          )}
          <button
            className="icon-button accent"
            type="button"
            onClick={onSubmit}
            disabled={!ready || submitting}
            title="Submit sidequest progress"
          >
            {submitting ? <LoaderCircle aria-hidden="true" className="spin" /> : <SendHorizontal aria-hidden="true" />}
            <span>Sync</span>
          </button>
        </div>
      </div>

      <div className="video-frame">
        <video ref={videoRef} className="camera-feed" playsInline muted />
        {trailEnabled ? (
          <div className="motion-trail" aria-hidden="true">
            {trailPoints.map((point, index) => (
              <span
                className="trail-dot"
                key={point.id}
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  opacity: Math.max(0.18, 1 - index / 24),
                  transform: `scale(${0.8 + point.strength * 1.1})`
                }}
              />
            ))}
          </div>
        ) : null}
        <canvas ref={canvasRef} className="pose-canvas" />
        <div className="scan-line" />
        <div className="quest-progress">
          <span>{questState.message}</span>
          <strong>{Math.round(questState.progress * 100)}%</strong>
          <div>
            <i style={{ width: `${questState.progress * 100}%` }} />
          </div>
        </div>
        <div className="capture-status">
          <RadioTower aria-hidden="true" />
          <span>{statusLabel(status, snapshot.hasPose)}</span>
        </div>
      </div>

      {error ? <p className="error-line">{error}</p> : null}
    </section>
  );
}

function statusLabel(status: TrackerStatus, hasPose: boolean): string {
  if (status === "loading") {
    return "Loading tracker";
  }
  if (status === "running" && hasPose) {
    return "Pose locked";
  }
  if (status === "running") {
    return "Searching";
  }
  if (status === "error") {
    return "Camera error";
  }
  return "Idle";
}
