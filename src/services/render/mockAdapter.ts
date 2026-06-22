// MockRenderAdapter — production-shaped pipeline that runs entirely
// client-side. Walks every render stage, appends structured logs to the job
// row via the `append_job_log` RPC, and writes an `exports` row + a
// placeholder `result_url` once finished. Designed so that switching to
// FFmpeg/Modal/Replicate is purely an adapter swap.
//
// The orchestrator keeps the job row authoritative; this adapter is the
// "worker" that progresses it.

import { supabase } from "@/integrations/supabase/client";
import { RENDER_STAGES, type RenderHandle, type RenderRequest, type RenderStage } from "@/services/types";
import type { RenderAdapter } from "./types";

const STAGES: RenderStage[] = [
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
];

/** Weight per stage — adds up to 100. Heavier stages (render/encoding) dominate. */
const STAGE_WEIGHTS: Record<RenderStage, number> = {
  queued: 0,
  uploading: 4,
  preparing_assets: 4,
  transcribing: 10,
  scene_detection: 6,
  silence_detection: 6,
  highlight_detection: 8,
  edit_planning: 6,
  subtitle_render: 8,
  video_render: 32,
  encoding: 12,
  uploading_export: 4,
  completed: 0,
};

const cancelled = new Set<string>();

async function log(jobId: string, level: "info" | "warn" | "error", message: string, stage?: RenderStage, data?: Record<string, unknown>) {
  await supabase.rpc("append_job_log", {
    _job_id: jobId,
    _level: level,
    _message: message,
    _stage: stage ?? null,
    _data: (data ?? null) as never,
  });
}

async function tickStage(jobId: string, stage: RenderStage, ms: number, baseProgress: number, stageWeight: number, signal: () => boolean) {
  const ticks = 10;
  for (let i = 1; i <= ticks; i++) {
    if (signal()) throw new Error("__cancelled__");
    await new Promise((r) => setTimeout(r, ms / ticks));
    const stageProgress = Math.round((i / ticks) * 100);
    const overall = Math.min(99, Math.round(baseProgress + (stageProgress / 100) * stageWeight));
    await supabase
      .from("processing_jobs")
      .update({ stage, stage_progress: stageProgress, progress: overall })
      .eq("id", jobId);
  }
}

async function runPipeline(jobId: string, req: RenderRequest) {
  const startedAt = Date.now();
  await supabase
    .from("processing_jobs")
    .update({ status: "processing", started_at: new Date().toISOString(), worker: "mock-ffmpeg" })
    .eq("id", jobId);
  await log(jobId, "info", "Worker mock-ffmpeg picked up job", "queued", { settings: req.settings });

  // Total expected wall-clock based on resolution (mock).
  const baseMs = req.settings.resolution === "4k" ? 9000 : req.settings.resolution === "2k" ? 7000 : 5000;
  let acc = 0;

  for (const stage of STAGES) {
    const weight = STAGE_WEIGHTS[stage];
    await log(jobId, "info", `${stageLabel(stage)}…`, stage);
    const stageMs = (baseMs * weight) / 100;
    await tickStage(jobId, stage, Math.max(300, stageMs), acc, weight, () => cancelled.has(jobId));
    acc += weight;
    await log(jobId, "info", `${stageLabel(stage)} ✓`, stage);
  }

  // Create export row (placeholder URL; real adapter writes the file to storage).
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");
  const { data: jobRow } = await supabase.from("processing_jobs").select("project_id").eq("id", jobId).single();
  const previewUrls = [
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
  ];
  const resultUrl = previewUrls[Math.floor(Math.random() * previewUrls.length)];
  const renderMs = Date.now() - startedAt;
  const bitrate = req.settings.bitrateKbps ?? defaultBitrate(req.settings.resolution);
  const sizeBytes = Math.round((bitrate / 8) * 1000 * (baseMs / 1000));

  const { data: exportRow } = await supabase
    .from("exports")
    .insert({
      project_id: jobRow!.project_id,
      user_id: u.user.id,
      job_id: jobId,
      storage_path: null,
      url: resultUrl,
      resolution: req.settings.resolution,
      fps: req.settings.fps,
      codec: req.settings.codec,
      bitrate_kbps: bitrate,
      aspect_ratio: req.settings.aspectRatio,
      audio_kbps: req.settings.audioQuality === "high" ? 256 : req.settings.audioQuality === "standard" ? 192 : 96,
      format: "mp4",
      burn_subs: req.settings.burnSubtitles,
      watermark: req.settings.watermark,
      duration_ms: baseMs,
      render_ms: renderMs,
      size_bytes: sizeBytes,
      status: "ready",
    })
    .select("id")
    .single();

  await supabase
    .from("processing_jobs")
    .update({
      status: "completed",
      progress: 100,
      stage: "completed",
      stage_progress: 100,
      finished_at: new Date().toISOString(),
      duration_ms: renderMs,
      result_url: resultUrl,
      export_id: exportRow?.id ?? null,
    })
    .eq("id", jobId);
  await log(jobId, "info", "Render completed", "completed", { renderMs, sizeBytes });
}

function defaultBitrate(res: string) {
  return res === "4k" ? 35000 : res === "2k" ? 16000 : res === "1080p" ? 8000 : 5000;
}

function stageLabel(s: RenderStage) {
  return s.replace(/_/g, " ");
}

export const mockRenderAdapter: RenderAdapter = {
  capabilities: {
    id: "mock-ffmpeg",
    name: "Mock FFmpeg",
    maxResolution: "4k",
    hardwareAcceleration: true,
    supportsCancel: true,
  },

  async enqueue(req, jobId) {
    cancelled.delete(jobId);
    // Run pipeline in background so the call returns immediately.
    void (async () => {
      try {
        await runPipeline(jobId, req);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg === "__cancelled__") {
          await supabase
            .from("processing_jobs")
            .update({ status: "cancelled", finished_at: new Date().toISOString() })
            .eq("id", jobId);
          await log(jobId, "warn", "Cancelled by user");
          return;
        }
        await supabase
          .from("processing_jobs")
          .update({ status: "failed", error: msg, finished_at: new Date().toISOString() })
          .eq("id", jobId);
        await log(jobId, "error", `Render failed: ${msg}`);
      }
    })();
    return {
      jobId,
      worker: "mock-ffmpeg",
      estimatedSeconds: req.settings.resolution === "4k" ? 9 : 5,
    };
  },

  async cancel(jobId) {
    cancelled.add(jobId);
    return true;
  },

  async retry(jobId) {
    const { data } = await supabase.from("processing_jobs").select("render_settings, attempt, max_attempts, project_id").eq("id", jobId).single();
    if (!data) throw new Error("Job not found");
    const attempt = (data.attempt ?? 1) + 1;
    await supabase
      .from("processing_jobs")
      .update({ status: "retrying", progress: 0, stage: null, stage_progress: 0, error: null, attempt })
      .eq("id", jobId);
    await log(jobId, "info", `Retry attempt ${attempt}/${data.max_attempts ?? 3}`);
    return this.enqueue({ projectId: data.project_id, settings: data.render_settings as never }, jobId);
  },

  async signOutputUrl(storagePath, expiresInSec) {
    const { data } = await supabase.storage.from("videos").createSignedUrl(storagePath, expiresInSec);
    return data?.signedUrl ?? "";
  },
};

// Reference the constant so future adapter swaps see the full stage table.
export const ALL_STAGES = RENDER_STAGES;
