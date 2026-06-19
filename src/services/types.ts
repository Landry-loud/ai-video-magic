// Shared types for the video-processing abstraction layer.
// These mirror the backend contract so swapping mock → real is zero refactor.

export type JobStatus = "queued" | "processing" | "completed" | "failed";
export type JobKind = "transcribe" | "render" | "thumbnail" | "analyze";
export type ProjectStatus = "draft" | "processing" | "ready" | "failed";
export type SubtitleStyle = "tiktok" | "minimal" | "gaming" | "podcast";
export type ExportResolution = "720p" | "1080p" | "2k" | "4k";

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
  resultUrl?: string | null;
  error?: string | null;
  createdAt: string;
}

export interface SubtitleCue {
  id: string;
  startMs: number;
  endMs: number;
  text: string;
  orderIndex: number;
}

export interface RenderSettings {
  resolution: ExportResolution;
  burnSubtitles: boolean;
  subtitleStyle: SubtitleStyle;
}
