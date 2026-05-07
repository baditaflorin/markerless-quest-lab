import { useCallback, useEffect, useRef, useState } from "react";
import type { Landmark, PoseLandmarker } from "@mediapipe/tasks-vision";
import { drawPoseOverlay } from "./drawPose";
import {
  modelAssetURLs,
  targetPartLabels,
  targetVisibility,
  type PoseTrackerOptions
} from "./options";
import { scorePoseQuality, updateSquatCounter, type PoseQuality, type SquatCounterState } from "./poseScoring";

const WASM_FILESET = {
  wasmLoaderPath: mediaPipeAsset("vision_wasm_internal.js"),
  wasmBinaryPath: mediaPipeAsset("vision_wasm_internal.wasm")
};
export type TrackerStatus = "idle" | "loading" | "running" | "error";

export type PoseSnapshot = PoseQuality & {
  reps: number;
  durationSeconds: number;
  hasPose: boolean;
  capturedAtMs: number;
  targetLabel: string;
  targetLocked: boolean;
  targetVisibility: number;
};

const emptySnapshot: PoseSnapshot = {
  score: 0,
  visibility: 0,
  inFrameRatio: 0,
  centerX: 0.5,
  shoulderTilt: 1,
  handsAboveHead: false,
  handsAboveShoulders: false,
  reps: 0,
  durationSeconds: 0,
  hasPose: false,
  capturedAtMs: 0,
  targetLabel: "Full body",
  targetLocked: false,
  targetVisibility: 0
};

export function usePoseTracker(options: PoseTrackerOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const poseConnectionsRef = useRef<{ start: number; end: number }[]>([]);
  const animationRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const squatStateRef = useRef<SquatCounterState>({ phase: "up", reps: 0 });
  const optionsRef = useRef(options);

  const [status, setStatus] = useState<TrackerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<PoseSnapshot>(emptySnapshot);

  const stop = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus("idle");
    setSnapshot(emptySnapshot);
    squatStateRef.current = { phase: "up", reps: 0 };
  }, []);

  const runLoop = useCallback(
    () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!video || !canvas || !context) {
        return;
      }

      const draw = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        const landmarker = landmarkerRef.current;
        if (!landmarker) {
          animationRef.current = requestAnimationFrame(draw);
          return;
        }
        const now = performance.now();
        const result = landmarker.detectForVideo(video, now);
        const landmarks = result.landmarks[0] as Landmark[] | undefined;

        if (landmarks) {
          drawPoseOverlay(context, landmarks, {
            artMode: optionsRef.current.artMode,
            connections: poseConnectionsRef.current,
            detail: optionsRef.current.landmarkDetail,
            targetPart: optionsRef.current.targetPart
          });
        }

        const quality = scorePoseQuality(landmarks);
        const lockedVisibility = targetVisibility(landmarks, optionsRef.current.targetPart);
        squatStateRef.current = updateSquatCounter(landmarks, squatStateRef.current);
        setSnapshot({
          ...quality,
          hasPose: Boolean(landmarks),
          reps: squatStateRef.current.reps,
          durationSeconds: Math.floor((now - startedAtRef.current) / 1000),
          capturedAtMs: now,
          targetLabel: targetPartLabels[optionsRef.current.targetPart],
          targetLocked: lockedVisibility >= 0.55,
          targetVisibility: lockedVisibility
        });

        animationRef.current = requestAnimationFrame(draw);
      };

      animationRef.current = requestAnimationFrame(draw);
    },
    []
  );

  const start = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const [{ PoseLandmarker }, stream] = await Promise.all([
        import("@mediapipe/tasks-vision"),
        navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          },
          audio: false
        })
      ]);

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        throw new Error("Video element is not ready.");
      }
      video.srcObject = stream;
      await video.play();

      landmarkerRef.current = await createLandmarker(PoseLandmarker, optionsRef.current.modelVariant);
      poseConnectionsRef.current = PoseLandmarker.POSE_CONNECTIONS;

      startedAtRef.current = performance.now();
      setStatus("running");
      runLoop();
    } catch (err) {
      stop();
      setStatus("error");
      setError(err instanceof Error ? err.message : "Camera tracking failed to start.");
    }
  }, [runLoop, stop]);

  const reloadModel = useCallback(async () => {
    if (status !== "running") {
      return;
    }
    const { PoseLandmarker } = await import("@mediapipe/tasks-vision");
    const next = await createLandmarker(PoseLandmarker, optionsRef.current.modelVariant);
    landmarkerRef.current?.close();
    landmarkerRef.current = next;
    poseConnectionsRef.current = PoseLandmarker.POSE_CONNECTIONS;
  }, [status]);

  useEffect(() => {
    const previousModel = optionsRef.current.modelVariant;
    optionsRef.current = options;
    setSnapshot((current) => ({
      ...current,
      targetLabel: targetPartLabels[options.targetPart]
    }));
    if (previousModel !== options.modelVariant) {
      void reloadModel();
    }
  }, [options, reloadModel]);

  useEffect(() => stop, [stop]);

  return {
    videoRef,
    canvasRef,
    status,
    error,
    snapshot,
    start,
    stop
  };
}

async function createLandmarker(
  PoseLandmarkerClass: typeof PoseLandmarker,
  modelVariant: PoseTrackerOptions["modelVariant"]
): Promise<PoseLandmarker> {
  return PoseLandmarkerClass.createFromOptions(WASM_FILESET, {
    baseOptions: {
      modelAssetPath: modelAssetURLs[modelVariant],
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numPoses: 1
  });
}

function mediaPipeAsset(filename: string): string {
  return `${import.meta.env.BASE_URL}vendor/mediapipe/wasm/${filename}`;
}
