import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Video, Sparkles, Clock, TrendingUp, Plus, Upload, FolderPlus, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({ meta: [{ title: "Overview — AI Edit Studio" }] }),
  component: Overview,
});

function Overview() {
  const { data: stats } = useQuery({
    queryKey: ["overview-stats"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const [projects, exports_, jobs, credits] = await Promise.all([
        supabase.from("projects").select("id, status", { count: "exact" }).eq("user_id", u.user.id),
        supabase.from("exports").select("id", { count: "exact" }).eq("user_id", u.user.id),
        supabase.from("processing_jobs").select("id", { count: "exact" }).eq("user_id", u.user.id).in("status", ["queued", "processing"]),
        supabase.from("credits").select("balance").eq("user_id", u.user.id).maybeSingle(),
      ]);
      return {
        projects: projects.count ?? 0,
        exports: exports_.count ?? 0,
        active: jobs.count ?? 0,
        credits: credits.data?.balance ?? 0,
      };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["overview-recent"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("projects")
        .select("id, name, status, created_at")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const cards = [
    { label: "Projects", value: stats?.projects ?? 0, icon: Video, hint: "All time" },
    { label: "Exports", value: stats?.exports ?? 0, icon: TrendingUp, hint: "Ready to share" },
    { label: "Processing", value: stats?.active ?? 0, icon: Clock, hint: "In queue" },
    { label: "Credits", value: stats?.credits ?? 0, icon: Sparkles, hint: "Available" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your editing studio at a glance.</p>
        </div>
        <Link
          to="/dashboard/projects"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-gradient px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-glow"
        >
          <Plus className="h-4 w-4" />
          New project
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className="rounded-2xl border border-border bg-surface p-5 shadow-card"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{c.label}</span>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 font-display text-3xl font-semibold tabular-nums">{c.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{c.hint}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-card lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">Recent projects</h2>
            <Link to="/dashboard/library" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
          </div>
          {recent && recent.length > 0 ? (
            <ul className="divide-y divide-border-subtle">
              {recent.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <ProjectRow id={p.id} name={p.name} status={p.status} createdAt={p.created_at} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyRecent />
          )}
        </div>
        <QuickActions />
      </div>
    </div>
  );
}

function ProjectRow({ id, name, status, createdAt }: { id: string; name: string; status: string; createdAt: string }) {
  return (
    <Link
      to="/dashboard/projects/$projectId"
      params={{ projectId: id }}
      className="flex w-full items-center justify-between gap-4 rounded-md px-2 py-1 -mx-2 hover:bg-elevated/60"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-9 w-12 shrink-0 place-items-center rounded-md bg-elevated text-muted-foreground ring-1 ring-border">
          <Video className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">{name}</div>
          <div className="text-xs text-muted-foreground">{formatRelative(createdAt)}</div>
        </div>
      </div>
      <StatusPill status={status} />
    </Link>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-elevated text-muted-foreground",
    processing: "bg-primary/15 text-primary",
    ready: "bg-success/15 text-success",
    failed: "bg-destructive/15 text-destructive",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${map[status] ?? map.draft}`}>{status}</span>;
}

function EmptyRecent() {
  const navigate = useNavigate();
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border bg-background/40 py-14 text-center">
      <Video className="h-7 w-7 text-muted-foreground" />
      <p className="mt-3 text-sm font-medium">No projects yet</p>
      <p className="mt-1 text-xs text-muted-foreground">Upload your first video to get started.</p>
      <button
        onClick={() => navigate({ to: "/dashboard/projects" })}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary-gradient px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-glow"
      >
        <Upload className="h-3.5 w-3.5" /> New project
      </button>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <h2 className="font-display text-base font-semibold">Quick actions</h2>
      <div className="mt-4 space-y-2">
        {[
          { to: "/dashboard/projects" as const, icon: FolderPlus, label: "New project", desc: "Upload a fresh video" },
          { to: "/dashboard/agent" as const, icon: Wand2, label: "AI agent", desc: "Describe your edit" },
          { to: "/dashboard/templates" as const, icon: Sparkles, label: "Browse templates", desc: "Start from a preset" },
        ].map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="flex items-center gap-3 rounded-lg border border-border bg-elevated/40 p-3 hover:bg-elevated"
          >
            <div className="grid h-9 w-9 place-items-center rounded-md bg-primary-gradient text-primary-foreground shadow-glow">
              <a.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">{a.label}</div>
              <div className="text-xs text-muted-foreground">{a.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
