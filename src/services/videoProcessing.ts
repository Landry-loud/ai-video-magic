// ----------------------------------------------------------------------------
// Video Processing Service Layer
// ----------------------------------------------------------------------------
// This module is the ONLY abstraction the UI imports for video work. Renders
// now flow through the pluggable adapter layer in `src/services/render/`.
// Transcription, thumbnails and analyses still use the mock job runner below;
// each can be promoted to its own adapter the same way `render` was.
// ----------------------------------------------------------------------------

import { supabase } from "@/integrations/supabase/client";
import { createRender } from "@/services/render";
import type {
  ProcessingJob,
  RenderSettings,
  SubtitleCue,
  UploadedVideo,
  VideoMeta,
} from "./types";
import { DEFAULT_RENDER_SETTINGS } from "./types";

// ---------- helpers ----------

const ACCEPTED = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska"];

async function probeVideo(file: File): Promise<VideoMeta> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.src = url;
    v.onloadedmetadata = () => {
      const meta: VideoMeta = {
        durationSec: Math.round(v.duration * 10) / 10,
        width: v.videoWidth,
        height: v.videoHeight,
        fps: 30,
        sizeBytes: file.size,
      };
      URL.revokeObjectURL(url);
      resolve(meta);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video metadata"));
    };
  });
}

function assertAccepted(file: File) {
  const ok =
    ACCEPTED.includes(file.type) ||
    /\.(mp4|mov|avi|mkv)$/i.test(file.name);
  if (!ok) throw new Error("Unsupported file format. Use MP4, MOV, AVI or MKV.");
  if (file.size > 500 * 1024 * 1024) throw new Error("File too large (500 MB max).");
}

// ---------- public API ----------

export async function uploadVideo(file: File): Promise<UploadedVideo> {
  assertAccepted(file);
  const meta = await probeVideo(file);

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const ext = file.name.split(".").pop() ?? "mp4";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("videos")
    .upload(path, file, { contentType: file.type || "video/mp4", upsert: false });
  if (upErr) throw upErr;

  const { data: row, error: dbErr } = await supabase
    .from("videos")
    .insert({
      user_id: userId,
      storage_path: path,
      filename: file.name,
      duration_sec: meta.durationSec,
      width: meta.width,
      height: meta.height,
      fps: meta.fps,
      size_bytes: meta.sizeBytes,
    })
    .select()
    .single();
  if (dbErr) throw dbErr;

  const { data: signed } = await supabase.storage
    .from("videos")
    .createSignedUrl(path, 60 * 60 * 8);

  return {
    id: row.id,
    storagePath: path,
    url: signed?.signedUrl ?? "",
    filename: file.name,
    meta,
  };
}

export async function getSignedUrl(storagePath: string): Promise<string> {
  const { data } = await supabase.storage
    .from("videos")
    .createSignedUrl(storagePath, 60 * 60 * 8);
  return data?.signedUrl ?? "";
}

// ---------- jobs ----------

async function createMockJob(projectId: string, kind: "transcribe" | "thumbnail" | "analyze") {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("processing_jobs")
    .insert({
      project_id: projectId,
      user_id: userId,
      kind,
      status: "queued",
      progress: 0,
      worker: "mock",
    })
    .select()
    .single();
  if (error) throw error;
  void runMockJob(data.id, kind);
  return { jobId: data.id as string };
}

async function runMockJob(jobId: string, kind: "transcribe" | "thumbnail" | "analyze") {
  const totalMs = 3000 + Math.random() * 6000;
  const steps = 20;
  const tick = totalMs / steps;
  await supabase.from("processing_jobs").update({ status: "processing", started_at: new Date().toISOString() }).eq("id", jobId);
  for (let i = 1; i <= steps; i++) {
    await new Promise((r) => setTimeout(r, tick));
    await supabase.from("processing_jobs").update({ progress: Math.round((i / steps) * 100) }).eq("id", jobId);
  }
  if (kind === "transcribe") {
    const { data: job } = await supabase.from("processing_jobs").select("project_id, user_id").eq("id", jobId).single();
    if (job) {
      const cues = mockSubtitleSet();
      await supabase.from("subtitles").insert(
        cues.map((c, idx) => ({
          project_id: job.project_id,
          user_id: job.user_id,
          start_ms: c.startMs,
          end_ms: c.endMs,
          text: c.text,
          order_index: idx,
        })),
      );
    }
  }
  await supabase
    .from("processing_jobs")
    .update({
      status: "completed",
      progress: 100,
      finished_at: new Date().toISOString(),
    })
    .eq("id", jobId);
}

function mockSubtitleSet(): Omit<SubtitleCue, "id" | "orderIndex">[] {
  const lines = [
    "Listen — this is the moment everything changes.",
    "Most people miss it.",
    "But once you see it, you can't unsee it.",
    "Here's exactly how it works.",
    "Step one: focus on the outcome.",
    "Step two: cut the noise.",
    "Step three: ship it today.",
    "That's the whole game.",
  ];
  let t = 600;
  return lines.map((text) => {
    const dur = 1400 + text.length * 35;
    const cue = { startMs: t, endMs: t + dur, text };
    t += dur + 200;
    return cue;
  });
}

export async function generateSubtitles(projectId: string) {
  return createMockJob(projectId, "transcribe");
}

export async function generateThumbnail(projectId: string) {
  return createMockJob(projectId, "thumbnail");
}

/**
 * Kick off a real render through the active adapter. Accepts a partial
 * RenderSettings object; missing fields fall back to DEFAULT_RENDER_SETTINGS.
 */
export async function requestEditRender(projectId: string, settings: Partial<RenderSettings>) {
  const job = await createRender({
    projectId,
    settings: { ...DEFAULT_RENDER_SETTINGS, ...settings },
  });
  return { jobId: job.id };
}

export async function getRenderStatus(jobId: string): Promise<ProcessingJob | null> {
  const { data } = await supabase.from("processing_jobs").select("*").eq("id", jobId).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    projectId: data.project_id,
    kind: data.kind,
    status: data.status,
    progress: data.progress,
    stage: data.stage as ProcessingJob["stage"],
    stageProgress: data.stage_progress,
    worker: data.worker,
    resultUrl: data.result_url,
    error: data.error,
    exportId: data.export_id,
    attempt: data.attempt,
    maxAttempts: data.max_attempts,
    createdAt: data.created_at,
  };
}
