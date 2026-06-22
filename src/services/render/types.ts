// Render-adapter contract. Every backend (FFmpeg, Modal, Replicate, future
// GPU clusters) implements this same interface. The UI never imports
// concrete adapters — it only sees the active adapter through `renderService`.

import type { RenderHandle, RenderRequest, RenderStage } from "@/services/types";

export interface RenderWorkerCapabilities {
  /** Backend identifier surfaced in job rows ("ffmpeg-local", "modal", "replicate"). */
  id: string;
  /** Human label. */
  name: string;
  /** Max output resolution this backend can produce. */
  maxResolution: "1080p" | "2k" | "4k";
  /** Whether this backend supports hardware acceleration. */
  hardwareAcceleration: boolean;
  /** Whether jobs can be cancelled mid-flight. */
  supportsCancel: boolean;
}

export interface RenderProgressUpdate {
  stage: RenderStage;
  /** 0-100 within the current stage. */
  stageProgress: number;
  /** 0-100 overall job progress (adapter-computed). */
  progress: number;
  etaSeconds?: number;
  message?: string;
}

export interface RenderAdapter {
  capabilities: RenderWorkerCapabilities;

  /** Enqueue a render. Returns a handle the orchestrator stores on the job row. */
  enqueue(req: RenderRequest, jobId: string): Promise<RenderHandle>;

  /** Best-effort cancellation. Resolves true if the worker accepted the cancel. */
  cancel(jobId: string): Promise<boolean>;

  /** Re-run a previously failed job. */
  retry(jobId: string): Promise<RenderHandle>;

  /**
   * Fetch a signed URL for the output of a completed job. Adapters that store
   * to Supabase storage should return signed-url-via-storage; adapters that
   * serve from their own CDN return a presigned URL with the requested TTL.
   */
  signOutputUrl(storagePath: string, expiresInSec: number): Promise<string>;
}
