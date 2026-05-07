import { useCallback, useEffect, useRef, useState } from "react";
import type { DrawingUtils, Landmark, PoseLandmarker } from "@mediapipe/tasks-vision";
import { scorePoseQuality, updateSquatCounter, type PoseQuality, type SquatCounterState } from "./poseScoring";

const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm";
const POSE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

export type TrackerStatus = "idle" | "loading" | "running" | "error";

export type PoseSnapshot = PoseQuality & {
  reps: number;
  durationSeconds: number;
  hasPose: boolean;
};

const emptySnapshot: PoseSnapshot = {
  score: 0,
  visibility: 0,
  inFrameRatio: 0,
  reps: 0,
  durationSeconds: 0,
  hasPose: false
};

export function usePoseTracker() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animationRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const squatStateRef = useRef<SquatCounterState>({ phase: "up", reps: 0 });

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

  const start = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const [{ FilesetResolver, PoseLandmarker, DrawingUtils }, stream] = await Promise.all([
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

      const fileset = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
      landmarkerRef.current = await PoseLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: POSE_MODEL_URL,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1
      });

      startedAtRef.current = performance.now();
      setStatus("running");
      runLoop(PoseLandmarker, DrawingUtils);
    } catch (err) {
      stop();
      setStatus("error");
      setError(err instanceof Error ? err.message : "Camera tracking failed to start.");
    }
  }, [stop]);

  const runLoop = useCallback(
    (poseLandmarkerClass: typeof PoseLandmarker, drawingUtilsClass: typeof DrawingUtils) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;
      const context = canvas?.getContext("2d");
      if (!video || !canvas || !context || !landmarker) {
        return;
      }

      const draw = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        const result = landmarker.detectForVideo(video, performance.now());
        const landmarks = result.landmarks[0] as Landmark[] | undefined;

        if (landmarks) {
          const drawingUtils = new drawingUtilsClass(context);
          drawingUtils.drawConnectors(landmarks, poseLandmarkerClass.POSE_CONNECTIONS, {
            color: "#2dd4bf",
            lineWidth: 3
          });
          drawingUtils.drawLandmarks(landmarks, {
            color: "#f8fafc",
            fillColor: "#fb7185",
            radius: 3
          });
        }

        const quality = scorePoseQuality(landmarks);
        squatStateRef.current = updateSquatCounter(landmarks, squatStateRef.current);
        setSnapshot({
          ...quality,
          hasPose: Boolean(landmarks),
          reps: squatStateRef.current.reps,
          durationSeconds: Math.floor((performance.now() - startedAtRef.current) / 1000)
        });

        animationRef.current = requestAnimationFrame(draw);
      };

      animationRef.current = requestAnimationFrame(draw);
    },
    []
  );

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
