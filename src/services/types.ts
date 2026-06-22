// Shared types for the video-processing abstraction layer.
// These mirror the backend contract so swapping mock → real is zero refactor.

import type { Database } from "@/integrations/supabase/types";

export type JobStatus = Database["public"]["Enums"]["job_status"];
export type JobKind = Database["public"]["Enums"]["job_kind"];
export type ProjectStatus = "draft" | "processing" | "ready" | "failed";
export type SubtitleStyle = "tiktok" | "minimal" | "gaming" | "podcast";
export type ExportResolution = "720p" | "1080p" | "2k" | "4k";

/** Full render pipeline stages, in execution order. */
export const RENDER_STAGES = [
  "queued",
  "uploading",
  "preparing_assets",
  "transcribing",
  "scene_detection",
  "silence_detection",
  "highlight_detection",
  "edit_planning",
  "subtitle_render",
  "video_render",
  "encoding",
  "uploading_export",
  "completed",
] as const;
export type RenderStage = (typeof RENDER_STAGES)[number];

export const STAGE_LABEL: Record<RenderStage, string> = {
  queued: "Queued",
  uploading: "Uploading source",
  preparing_assets: "Preparing assets",
  transcribing: "Transcribing audio",
  scene_detection: "Detecting scenes",
  silence_detection: "Detecting silence",
  highlight_detection: "Detecting highlights",
  edit_planning: "Planning edit",
  subtitle_render: "Rendering subtitles",
  video_render: "Rendering video",
  encoding: "Encoding output",
  uploading_export: "Uploading export",
  completed: "Completed",
};

/** Terminal job statuses surfaced in the UI. */
export const TERMINAL_STATUSES: JobStatus[] = ["completed", "failed", "cancelled"];

export interface VideoMeta {
  durationSec: number;
  width: number;
  height: number;
  fps: number;
  sizeBytes: number;
}

export interface UploadedVideo {
  id: string;
  storagePath: string;
  url: string;
  filename: string;
  meta: VideoMeta;
}

export interface ProcessingJob {
  id: string;
  projectId: string;
  kind: JobKind;
  status: JobStatus;
  progress: number;
  stage?: RenderStage | null;
  stageProgress?: number;
  attempt?: number;
  maxAttempts?: number;
  worker?: string | null;
  resultUrl?: string | null;
  error?: string | null;
  durationMs?: number | null;
  etaSeconds?: number | null;
  exportId?: string | null;
  estimatedCredits?: number | null;
  creditsCharged?: number | null;
  logs?: JobLogEntry[];
  renderSettings?: RenderSettings | null;
  createdAt: string;
}

export interface JobLogEntry {
  ts: number;
  level: "info" | "warn" | "error" | "debug";
  stage?: RenderStage | null;
  message: string;
  data?: Record<string, unknown> | null;
}

export interface SubtitleCue {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  orderIndex: number;
}

export type VideoCodec = "h264" | "h265" | "vp9" | "av1";
export type AudioQuality = "low" | "standard" | "high";
export type AspectRatio = "9:16" | "1:1" | "16:9" | "4:5";

/** Advanced render settings. Adapters consume this verbatim. */
export interface RenderSettings {
  resolution: ExportResolution;
  fps: 24 | 30 | 60;
  codec: VideoCodec;
  bitrateKbps?: number;
  aspectRatio: AspectRatio;
  audioQuality: AudioQuality;
  burnSubtitles: boolean;
  subtitleStyle: SubtitleStyle;
  watermark: boolean;
  hardwareAcceleration: boolean;
  preset?: "fast" | "balanced" | "quality";
}

export const DEFAULT_RENDER_SETTINGS: RenderSettings = {
  resolution: "1080p",
  fps: 30,
  codec: "h264",
  aspectRatio: "9:16",
  audioQuality: "standard",
  burnSubtitles: true,
  subtitleStyle: "tiktok",
  watermark: true,
  hardwareAcceleration: true,
  preset: "balanced",
};

export interface RenderRequest {
  projectId: string;
  videoId?: string | null;
  settings: RenderSettings;
}

/** Returned by the adapter once a render is enqueued. */
export interface RenderHandle {
  jobId: string;
  worker: string;
  estimatedSeconds: number;
}

export interface ExportRecord {
  id: string;
  jobId: string | null;
  projectId: string;
  projectName?: string | null;
  storagePath: string | null;
  resolution: string;
  fps: number | null;
  codec: string | null;
  bitrateKbps: number | null;
  format: string;
  durationMs: number | null;
  renderMs: number | null;
  sizeBytes: number | null;
  status: string;
  watermark: boolean;
  thumbnailUrl: string | null;
  createdAt: string;
}
