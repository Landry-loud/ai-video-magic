// AI analysis cache. Persists every analysis the agent produces so the
// next run reuses prior work instead of burning more credits.

import { supabase } from "@/integrations/supabase/client";

export type AnalysisKind =
  | "scenes"
  | "silence"
  | "highlights"
  | "emotions"
  | "cuts"
  | "strategy";

export interface AnalysisRecord<T = unknown> {
  id: string;
  projectId: string;
  kind: AnalysisKind;
  payload: T;
  score: number | null;
  sourceHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getAnalysis<T = unknown>(
  projectId: string,
  kind: AnalysisKind,
): Promise<AnalysisRecord<T> | null> {
  const { data } = await supabase
    .from("ai_analyses")
    .select("*")
    .eq("project_id", projectId)
    .eq("kind", kind)
    .maybeSingle();
  if (!data) return null;
  return map<T>(data);
}

export async function saveAnalysis<T = unknown>(args: {
  projectId: string;
  kind: AnalysisKind;
  payload: T;
  score?: number;
  sourceHash?: string;
}): Promise<AnalysisRecord<T>> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("ai_analyses")
    .upsert(
      {
        user_id: u.user.id,
        project_id: args.projectId,
        kind: args.kind,
        payload: args.payload as never,
        score: args.score ?? null,
        source_hash: args.sourceHash ?? null,
      },
      { onConflict: "project_id,kind" },
    )
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to save analysis");
  return map<T>(data);
}

export async function listAnalyses(projectId: string): Promise<AnalysisRecord[]> {
  const { data } = await supabase.from("ai_analyses").select("*").eq("project_id", projectId);
  return (data ?? []).map((row) => map(row));
}

function map<T>(row: Record<string, unknown>): AnalysisRecord<T> {
  const r = row as { id: string; project_id: string; kind: AnalysisKind; payload: T; score: number | null; source_hash: string | null; created_at: string; updated_at: string };
  return {
    id: r.id,
    projectId: r.project_id,
    kind: r.kind,
    payload: r.payload,
    score: r.score,
    sourceHash: r.source_hash,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
