import { Camera, CircleStop, LoaderCircle, RadioTower, SendHorizontal } from "lucide-react";
import type { RefObject } from "react";
import type { Challenge } from "../api/types";
import type { PoseSnapshot, TrackerStatus } from "../pose/usePoseTracker";

type Props = {
  activeChallenge: Challenge | null;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onSubmit: () => void;
  snapshot: PoseSnapshot;
  status: TrackerStatus;
  submitting: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
};

export function CaptureStage({
  activeChallenge,
  canvasRef,
  error,
  onStart,
  onStop,
  onSubmit,
  snapshot,
  status,
  submitting,
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
            <span>Submit</span>
          </button>
        </div>
      </div>

      <div className="video-frame">
        <video ref={videoRef} className="camera-feed" playsInline muted />
        <canvas ref={canvasRef} className="pose-canvas" />
        <div className="scan-line" />
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
