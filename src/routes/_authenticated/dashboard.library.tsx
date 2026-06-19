import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Library, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/library")({
  head: () => ({ meta: [{ title: "Library — AI Edit Studio" }] }),
  component: LibraryPage,
});

function LibraryPage() {
  const { data } = useQuery({
    queryKey: ["library"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { projects: [], exports: [] };
      const [{ data: projects }, { data: exports_ }] = await Promise.all([
        supabase.from("projects").select("id, name, status, created_at").eq("user_id", u.user.id).order("created_at", { ascending: false }),
        supabase.from("exports").select("id, project_id, resolution, url, created_at").eq("user_id", u.user.id).order("created_at", { ascending: false }),
      ]);
      return { projects: projects ?? [], exports: exports_ ?? [] };
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every project, every export — in one place.</p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold"><Library className="h-4 w-4 text-primary" /> Projects</h2>
        {data?.projects?.length ? (
          <ul className="divide-y divide-border-subtle">
            {data.projects.map((p) => (
              <li key={p.id} className="py-3">
                <Link to="/dashboard/projects/$projectId" params={{ projectId: p.id }} className="flex items-center justify-between gap-4 rounded-md px-2 -mx-2 py-1 hover:bg-elevated/60">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-9 w-12 shrink-0 place-items-center rounded-md bg-elevated text-muted-foreground ring-1 ring-border">
                      <Video className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{formatRelative(p.created_at)}</div>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-elevated px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{p.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : <Empty label="No projects yet" />}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-4 font-display text-base font-semibold">Exports</h2>
        {data?.exports?.length ? (
          <ul className="divide-y divide-border-subtle">
            {data.exports.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-3 text-sm">
                <span>{e.resolution} export</span>
                <span className="text-xs text-muted-foreground">{formatRelative(e.created_at)}</span>
              </li>
            ))}
          </ul>
        ) : <Empty label="No exports yet" />}
      </section>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="rounded-lg border border-dashed border-border bg-background/40 p-6 text-center text-sm text-muted-foreground">{label}</p>;
}
