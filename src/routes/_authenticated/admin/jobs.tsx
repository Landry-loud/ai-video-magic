import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminListJobs } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/jobs")({ component: AdminJobs });

const STATUSES = ["", "queued", "processing", "completed", "failed", "cancelled"] as const;

function AdminJobs() {
  const list = useServerFn(adminListJobs);
  const [status, setStatus] = useState<string>("");
  const { data, isLoading } = useQuery({ queryKey: ["admin-jobs", status], queryFn: () => list({ data: { status: status || undefined } }), refetchInterval: 5000 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Jobs</h1>
        <div className="flex gap-1">{STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-md px-2.5 py-1 text-xs capitalize ${status === s ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>{s || "all"}</button>
        ))}</div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-elevated/40 text-xs text-muted-foreground">
            <tr><th className="px-4 py-2 text-left">Kind</th><th className="px-4 py-2 text-left">Status</th><th className="px-4 py-2 text-left">Stage</th><th className="px-4 py-2 text-right">Progress</th><th className="px-4 py-2 text-left">Created</th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {(data ?? []).map((j) => (
              <tr key={j.id} className="border-t border-border-subtle">
                <td className="px-4 py-2 font-medium">{j.kind}</td>
                <td className="px-4 py-2"><span className={`rounded-full px-2 py-0.5 text-xs ${j.status === "completed" ? "bg-success/15 text-success" : j.status === "failed" ? "bg-destructive/15 text-destructive" : "bg-elevated text-muted-foreground"}`}>{j.status}</span></td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{j.stage ?? "—"}</td>
                <td className="px-4 py-2 text-right tabular-nums">{j.progress ?? 0}%</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(j.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!isLoading && !data?.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No jobs.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
