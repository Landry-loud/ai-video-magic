// Render service facade. The UI imports ONLY from this module — never from
// concrete adapters. Swapping backends is a one-line change here.

import { supabase } from "@/integrations/supabase/client";
import { spendCredits } from "@/lib/credits";
import { CREDIT_COSTS } from "@/lib/plans";
import {
  DEFAULT_RENDER_SETTINGS,
  type ExportRecord,
  type ProcessingJob,
  type RenderRequest,
  type RenderSettings,
} from "@/services/types";
import { mockRenderAdapter } from "./mockAdapter";
import type { RenderAdapter } from "./types";

/** Active render backend. Swap this single line to plug FFmpeg / Modal / Replicate. */
export const renderAdapter: RenderAdapter = mockRenderAdapter;

export function renderCostCredits(settings: RenderSettings): number {
  const key = `render_${settings.resolution === "2k" ? "2k" : settings.resolution}` as keyof typeof CREDIT_COSTS;
  const base = CREDIT_COSTS[key] ?? CREDIT_COSTS.render_1080p;
  // 60fps and 4K renders cost a small premium.
  const fpsMult = settings.fps >= 60 ? 1.5 : 1;
  return Math.ceil(base * fpsMult);
}

/** Create a render job: deduct credits, persist row, enqueue on the adapter. */
export async function createRender(req: RenderRequest): Promise<ProcessingJob> {
  const settings: RenderSettings = { ...DEFAULT_RENDER_SETTINGS, ...req.settings };
  const cost = renderCostCredits(settings);

  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");

  // Charge credits first so failed jobs still leave an audit trail.
  await spendCredits(supabase, cost, "render_export", req.projectId);

  const { data: job, error } = await supabase
    .from("processing_jobs")
    .insert({
      project_id: req.projectId,
      user_id: u.user.id,
      kind: "render",
      status: "queued",
      progress: 0,
      stage: "queued",
      stage_progress: 0,
      attempt: 1,
      max_attempts: 3,
      worker: renderAdapter.capabilities.id,
      render_settings: settings as never,
      estimated_credits: cost,
      credits_charged: cost,
    })
    .select("*")
    .single();
  if (error || !job) throw error ?? new Error("Failed to create render job");

  await renderAdapter.enqueue({ ...req, settings }, job.id);
  return mapJob(job);
}

export async function cancelRender(jobId: string) {
  await renderAdapter.cancel(jobId);
  await supabase.rpc("cancel_job", { _job_id: jobId });
}

export async function retryRender(jobId: string) {
  return renderAdapter.retry(jobId);
}

export async function deleteRender(jobId: string) {
  // Deleting a job cascades to its export row via FK? exports.job_id is SET NULL,
  // so we delete the export first, then the job.
  const { data: job } = await supabase.from("processing_jobs").select("export_id").eq("id", jobId).maybeSingle();
  if (job?.export_id) await supabase.from("exports").delete().eq("id", job.export_id);
  await supabase.from("processing_jobs").delete().eq("id", jobId);
}

/** Signed download URL with expiry. Falls back to result_url for adapters that serve their own CDN. */
export async function signExportUrl(exportId: string, expiresInSec = 60 * 60): Promise<string> {
  const { data, error } = await supabase
    .from("exports")
    .select("storage_path, url")
    .eq("id", exportId)
    .single();
  if (error || !data) throw error ?? new Error("Export not found");
  if (data.storage_path) return renderAdapter.signOutputUrl(data.storage_path, expiresInSec);
  return data.url ?? "";
}

export async function listRenders(opts: {
  search?: string;
  status?: string | "all";
  resolution?: string | "all";
  page?: number;
  pageSize?: number;
} = {}): Promise<{ rows: RenderHistoryRow[]; total: number }> {
  const page = opts.page ?? 0;
  const pageSize = opts.pageSize ?? 20;
  let q = supabase
    .from("processing_jobs")
    .select("*, exports!processing_jobs_export_id_fkey(*), project:projects(id, name)", { count: "exact" })
    .eq("kind", "render")
    .order("created_at", { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);
  if (opts.status && opts.status !== "all") q = q.eq("status", opts.status);
  const { data, error, count } = await q;
  if (error) throw error;
  let rows: RenderHistoryRow[] = (data ?? []).map((row) => mapHistory(row));
  if (opts.resolution && opts.resolution !== "all") rows = rows.filter((r) => r.resolution === opts.resolution);
  if (opts.search) {
    const s = opts.search.toLowerCase();
    rows = rows.filter((r) => (r.projectName ?? "").toLowerCase().includes(s) || r.id.includes(s));
  }
  return { rows, total: count ?? rows.length };
}

export interface RenderHistoryRow {
  id: string;
  projectId: string;
  projectName: string | null;
  status: string;
  stage: string | null;
  progress: number;
  worker: string | null;
  resolution: string;
  fps: number | null;
  codec: string | null;
  bitrateKbps: number | null;
  durationMs: number | null;
  renderMs: number | null;
  sizeBytes: number | null;
  credits: number | null;
  attempt: number;
  maxAttempts: number;
  exportId: string | null;
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
}

function mapHistory(row: Record<string, unknown>): RenderHistoryRow {
  const r = row as {
    id: string; project_id: string; status: string; stage: string | null; progress: number;
    worker: string | null; render_settings: { resolution?: string; fps?: number; codec?: string; bitrateKbps?: number } | null;
    duration_ms: number | null; credits_charged: number | null; attempt: number; max_attempts: number;
    export_id: string | null; error: string | null; created_at: string; finished_at: string | null;
    project?: { name?: string } | null; exports?: { resolution: string; fps: number | null; codec: string | null; bitrate_kbps: number | null; size_bytes: number | null; render_ms: number | null } | null;
  };
  const ex = r.exports;
  const s = r.render_settings;
  return {
    id: r.id,
    projectId: r.project_id,
    projectName: r.project?.name ?? null,
    status: r.status,
    stage: r.stage,
    progress: r.progress,
    worker: r.worker,
    resolution: ex?.resolution ?? s?.resolution ?? "1080p",
    fps: ex?.fps ?? s?.fps ?? null,
    codec: ex?.codec ?? s?.codec ?? "h264",
    bitrateKbps: ex?.bitrate_kbps ?? s?.bitrateKbps ?? null,
    durationMs: r.duration_ms,
    renderMs: ex?.render_ms ?? null,
    sizeBytes: ex?.size_bytes ?? null,
    credits: r.credits_charged,
    attempt: r.attempt,
    maxAttempts: r.max_attempts,
    exportId: r.export_id,
    error: r.error,
    createdAt: r.created_at,
    finishedAt: r.finished_at,
  };
}

function mapJob(row: Record<string, unknown>): ProcessingJob {
  const r = row as {
    id: string; project_id: string; kind: ProcessingJob["kind"]; status: ProcessingJob["status"];
    progress: number; stage: ProcessingJob["stage"]; stage_progress: number; worker: string | null;
    result_url: string | null; error: string | null; created_at: string; export_id: string | null;
    attempt: number; max_attempts: number; estimated_credits: number | null; credits_charged: number | null;
    render_settings: RenderSettings | null;
  };
  return {
    id: r.id,
    projectId: r.project_id,
    kind: r.kind,
    status: r.status,
    progress: r.progress,
    stage: r.stage,
    stageProgress: r.stage_progress,
    worker: r.worker,
    resultUrl: r.result_url,
    error: r.error,
    createdAt: r.created_at,
    exportId: r.export_id,
    attempt: r.attempt,
    maxAttempts: r.max_attempts,
    estimatedCredits: r.estimated_credits,
    creditsCharged: r.credits_charged,
    renderSettings: r.render_settings,
  };
}

export { renderAdapter as activeRenderAdapter };
