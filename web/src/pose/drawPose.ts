import type { Landmark } from "@mediapipe/tasks-vision";
import { landmarkIndexesForTarget, type ArtMode, type LandmarkDetail, type TargetPart } from "./options";

type Connection = { start: number; end: number };

type DrawOptions = {
  artMode: ArtMode;
  connections: Connection[];
  detail: LandmarkDetail;
  targetPart: TargetPart;
};

const palettes: Record<ArtMode, { line: string; point: string; dim: string; halo: string }> = {
  neon: { line: "#2dd4bf", point: "#fb7185", dim: "rgba(185,177,164,0.24)", halo: "rgba(45,212,191,0.22)" },
  constellation: { line: "#fbbf24", point: "#f8fafc", dim: "rgba(248,250,252,0.22)", halo: "rgba(251,191,36,0.18)" },
  ink: { line: "#f7f4ec", point: "#111111", dim: "rgba(247,244,236,0.20)", halo: "rgba(247,244,236,0.12)" },
  thermal: { line: "#fb7185", point: "#fbbf24", dim: "rgba(251,113,133,0.20)", halo: "rgba(251,113,133,0.20)" },
  blueprint: { line: "#7dd3fc", point: "#dbeafe", dim: "rgba(125,211,252,0.20)", halo: "rgba(59,130,246,0.18)" }
};

export function drawPoseOverlay(context: CanvasRenderingContext2D, landmarks: Landmark[], options: DrawOptions): void {
  const palette = palettes[options.artMode];
  const targetIndexes = landmarkIndexesForTarget(options.targetPart, options.detail);
  const fullBody = options.targetPart === "full-body";

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowBlur = options.artMode === "ink" ? 0 : 14;
  context.shadowColor = palette.halo;

  for (const connection of options.connections) {
    const start = landmarks[connection.start];
    const end = landmarks[connection.end];
    if (!start || !end) {
      continue;
    }
    const highlighted = fullBody || (targetIndexes.has(connection.start) && targetIndexes.has(connection.end));
    context.strokeStyle = highlighted ? palette.line : palette.dim;
    context.lineWidth = highlighted ? 3 : 1.5;
    drawLine(context, start.x, start.y, end.x, end.y);
  }

  landmarks.forEach((landmark, index) => {
    const highlighted = fullBody || targetIndexes.has(index);
    if (!highlighted && options.detail === "core") {
      return;
    }
    context.fillStyle = highlighted ? palette.point : palette.dim;
    context.strokeStyle = highlighted ? palette.line : palette.dim;
    drawPoint(context, landmark.x, landmark.y, highlighted ? 4 : 2.4);
  });

  context.restore();
}

function drawLine(context: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number): void {
  context.beginPath();
  context.moveTo(ax * context.canvas.width, ay * context.canvas.height);
  context.lineTo(bx * context.canvas.width, by * context.canvas.height);
  context.stroke();
}

function drawPoint(context: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  context.beginPath();
  context.arc(x * context.canvas.width, y * context.canvas.height, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
}
