// Render history page — every render the user has produced, with search,
// status filter, resolution filter, pagination, retry/cancel/delete and
// signed-URL downloads. Polls while any job is active.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft, ChevronRight, Download, FileVideo, Loader2, RotateCw,
  Search, Trash2, X, Activity, Cpu, Clock, HardDrive, Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listRenders, cancelRender, retryRender, deleteRender, signExportUrl, type RenderHistoryRow } from "@/services/render";
import { STAGE_LABEL, type RenderStage } from "@/services/types";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/renders")({
  head: () => ({ meta: [{ title: "Renders — AI Edit Studio" }] }),
  component: RendersPage,
});

const PAGE_SIZE = 12;

function RendersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [resolution, setResolution] = useState<string>("all");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["renders", { search, status, resolution, page }],
    queryFn: () => listRenders({ search, status, resolution, page, pageSize: PAGE_SIZE }),
    refetchInterval: (q) => {
      const rows = (q.state.data as { rows: RenderHistoryRow[] } | undefined)?.rows ?? [];
      return rows.some((r) => ["queued", "processing", "uploading", "preparing", "retrying"].includes(r.status)) ? 1500 : false;
    },
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const cancel = useMutation({
    mutationFn: cancelRender,
    onSuccess: () => { toast.info("Render cancelled"); qc.invalidateQueries({ queryKey: ["renders"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const retry = useMutation({
    mutationFn: retryRender,
    onSuccess: () => { toast.info("Retrying…"); qc.invalidateQueries({ queryKey: ["renders"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: deleteRender,
    onSuccess: () => { toast.success("Render deleted"); qc.invalidateQueries({ queryKey: ["renders"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const download = useMutation({
    mutationFn: async (exportId: string) => {
      const url = await signExportUrl(exportId, 60 * 60);
      if (!url) throw new Error("No download URL available yet");
      window.open(url, "_blank", "noopener,noreferrer");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Aggregate stats
  const stats = {
    total: rows.length,
    avgRenderMs: avg(rows.map((r) => r.renderMs ?? 0).filter(Boolean)),
    credits: rows.reduce((acc, r) => acc + (r.credits ?? 0), 0),
    failed: rows.filter((r) => r.status === "failed").length,
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Renders</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every export, with live progress, signed downloads and retries.</p>
        </div>
      </header>

      {/* monitoring strip */}
      <section className="grid gap-3 md:grid-cols-4">
        <Stat icon={<Activity className="h-3.5 w-3.5" />} label="Visible jobs" value={String(stats.total)} />
        <Stat icon={<Clock className="h-3.5 w-3.5" />} label="Avg render" value={stats.avgRenderMs ? `${(stats.avgRenderMs / 1000).toFixed(1)}s` : "—"} />
        <Stat icon={<Sparkles className="h-3.5 w-3.5" />} label="Credits spent" value={stats.credits.toLocaleString()} />
        <Stat icon={<Cpu className="h-3.5 w-3.5" />} label="Failed" value={String(stats.failed)} tone={stats.failed ? "warning" : "default"} />
      </section>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by project name or job id…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="h-9 pl-8 text-sm" />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
          <SelectTrigger className="h-9 w-[150px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="queued">Queued</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={resolution} onValueChange={(v) => { setResolution(v); setPage(0); }}>
          <SelectTrigger className="h-9 w-[150px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All resolutions</SelectItem>
            <SelectItem value="720p">720p</SelectItem>
            <SelectItem value="1080p">1080p</SelectItem>
            <SelectItem value="2k">2K</SelectItem>
            <SelectItem value="4k">4K</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        {isLoading ? (
          <div className="grid place-items-center p-16 text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading renders…</div>
        ) : rows.length === 0 ? (
          <div className="grid place-items-center gap-2 p-16 text-center">
            <FileVideo className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm font-medium">No renders yet</div>
            <p className="text-xs text-muted-foreground">Start a render from any project to see it here.</p>
            <Button asChild size="sm" variant="outline" className="mt-2"><Link to="/dashboard/projects">Open projects</Link></Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-elevated/30 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="p-3">Project</th>
                <th className="p-3">Status</th>
                <th className="p-3">Output</th>
                <th className="p-3">Duration</th>
                <th className="p-3">Size</th>
                <th className="p-3">Credits</th>
                <th className="p-3">Created</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {rows.map((r) => <RenderRow key={r.id} row={r} onCancel={() => cancel.mutate(r.id)} onRetry={() => retry.mutate(r.id)} onDelete={() => remove.mutate(r.id)} onDownload={() => r.exportId && download.mutate(r.exportId)} />)}
            </tbody>
          </table>
        )}
      </div>

      {/* pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-xs text-muted-foreground">Page {page + 1} of {pages}</span>
          <Button size="sm" variant="outline" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}

function RenderRow({ row, onCancel, onRetry, onDelete, onDownload }: {
  row: RenderHistoryRow;
  onCancel: () => void; onRetry: () => void; onDelete: () => void; onDownload: () => void;
}) {
  const live = ["queued", "processing", "uploading", "preparing", "retrying"].includes(row.status);
  const stageLabel = row.stage ? (STAGE_LABEL[row.stage as RenderStage] ?? row.stage) : null;
  return (
    <tr className="hover:bg-elevated/40">
      <td className="p-3">
        <Link to="/dashboard/projects/$projectId" params={{ projectId: row.projectId }} className="flex items-center gap-2 text-foreground hover:text-primary">
          <div className="grid h-8 w-10 shrink-0 place-items-center rounded-md bg-elevated text-muted-foreground ring-1 ring-border">
            <FileVideo className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{row.projectName ?? "Untitled"}</div>
            <div className="font-mono text-[10px] text-muted-foreground">{row.id.slice(0, 8)}</div>
          </div>
        </Link>
      </td>
      <td className="p-3">
        <StatusBadge status={row.status} />
        {live && (
          <div className="mt-1.5 w-40">
            <Progress value={row.progress} className="h-1" />
            <div className="mt-0.5 text-[10px] text-muted-foreground">{stageLabel} · {row.progress}%</div>
          </div>
        )}
        {row.status === "failed" && row.error && (
          <div className="mt-1 max-w-[180px] truncate text-[10px] text-destructive" title={row.error}>{row.error}</div>
        )}
      </td>
      <td className="p-3 text-xs text-muted-foreground">
        <div className="text-foreground">{row.resolution} · {row.fps ?? "—"}fps</div>
        <div className="text-[10px]">{(row.codec ?? "—").toUpperCase()} · {row.bitrateKbps ? `${(row.bitrateKbps / 1000).toFixed(1)} Mbps` : "—"}</div>
      </td>
      <td className="p-3 text-xs">
        <div className="text-foreground">{row.durationMs ? `${(row.durationMs / 1000).toFixed(1)}s` : "—"}</div>
        <div className="text-[10px] text-muted-foreground">render {row.renderMs ? `${(row.renderMs / 1000).toFixed(1)}s` : "—"}</div>
      </td>
      <td className="p-3 text-xs"><span className="flex items-center gap-1"><HardDrive className="h-3 w-3 text-muted-foreground" />{row.sizeBytes ? `${(row.sizeBytes / 1024 / 1024).toFixed(1)} MB` : "—"}</span></td>
      <td className="p-3 text-xs"><span className="rounded-full bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">{row.credits ?? "—"}</span></td>
      <td className="p-3 text-xs text-muted-foreground">{formatRelative(row.createdAt)}</td>
      <td className="p-3">
        <div className="flex items-center justify-end gap-1">
          {row.status === "completed" && row.exportId && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onDownload}><Download className="mr-1 h-3 w-3" /> Download</Button>
          )}
          {live && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive" onClick={onCancel}><X className="h-3.5 w-3.5" /></Button>
          )}
          {(row.status === "failed" || row.status === "cancelled") && row.attempt < row.maxAttempts && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onRetry}><RotateCw className="mr-1 h-3 w-3" /> Retry</Button>
          )}
          {!live && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground hover:text-destructive" onClick={onDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: string; label: string }> = {
    queued: { tone: "bg-muted text-muted-foreground", label: "Queued" },
    processing: { tone: "bg-primary/15 text-primary", label: "Processing" },
    uploading: { tone: "bg-primary/15 text-primary", label: "Uploading" },
    preparing: { tone: "bg-primary/15 text-primary", label: "Preparing" },
    retrying: { tone: "bg-warning/15 text-warning", label: "Retrying" },
    completed: { tone: "bg-success/15 text-success", label: "Completed" },
    failed: { tone: "bg-destructive/15 text-destructive", label: "Failed" },
    cancelled: { tone: "bg-muted text-muted-foreground", label: "Cancelled" },
  };
  const s = map[status] ?? { tone: "bg-muted", label: status };
  return <Badge className={`${s.tone} border-0 text-[10px] uppercase tracking-wider`}>{s.label}</Badge>;
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "default" | "warning" }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">{icon} {label}</div>
      <div className={`mt-1 font-display text-xl font-semibold tabular-nums ${tone === "warning" ? "text-warning" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function avg(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
