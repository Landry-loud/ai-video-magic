import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Video as VideoIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UploadDropzone, VideoMetaBar } from "@/components/dashboard/UploadDropzone";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatRelative } from "@/lib/format";
import type { UploadedVideo } from "@/services/types";

export const Route = createFileRoute("/_authenticated/dashboard/projects")({
  head: () => ({ meta: [{ title: "Projects — AI Edit Studio" }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { data, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("projects")
        .select("id, name, prompt, status, created_at, videos(duration_sec)")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">Each project starts with a video and a prompt.</p>
        </div>
        <NewProjectDialog onCreated={() => refetch()} />
      </div>

      {data && data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <Link
              key={p.id}
              to="/dashboard/projects/$projectId"
              params={{ projectId: p.id }}
              className="group rounded-2xl border border-border bg-surface p-4 shadow-card transition-colors hover:border-primary/40"
            >
              <div className="aspect-video overflow-hidden rounded-lg bg-elevated grid place-items-center">
                <VideoIcon className="h-7 w-7 text-muted-foreground/60" />
              </div>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-medium text-foreground group-hover:text-primary">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{formatRelative(p.created_at)}</div>
                </div>
                <span className="shrink-0 rounded-full bg-elevated px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{p.status}</span>
              </div>
              {p.prompt && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.prompt}</p>}
            </Link>
          ))}
        </div>
      ) : (
        <EmptyProjects onCreated={() => refetch()} />
      )}
    </div>
  );
}

function EmptyProjects({ onCreated }: { onCreated: () => void }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-surface py-20 text-center">
      <VideoIcon className="h-8 w-8 text-muted-foreground" />
      <h3 className="mt-4 font-display text-lg font-semibold">No projects yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">Upload your first video to start editing with AI.</p>
      <div className="mt-5">
        <NewProjectDialog onCreated={onCreated} />
      </div>
    </div>
  );
}

function NewProjectDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [video, setVideo] = useState<UploadedVideo | null>(null);
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const handleUploaded = (v: UploadedVideo) => {
    setVideo(v);
    if (!name) setName(v.filename.replace(/\.[^.]+$/, ""));
  };

  const create = async () => {
    if (!video) return;
    setCreating(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("projects")
        .insert({ user_id: u.user.id, video_id: video.id, name: name || "Untitled project", prompt: prompt || null, status: "draft" })
        .select()
        .single();
      if (error) throw error;
      toast.success("Project created");
      setOpen(false);
      setVideo(null); setName(""); setPrompt("");
      onCreated();
      navigate({ to: "/dashboard/projects/$projectId", params: { projectId: data.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create project");
    } finally { setCreating(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary-gradient text-primary-foreground shadow-glow">
          <Plus className="mr-2 h-4 w-4" /> New project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>
        {!video ? (
          <UploadDropzone onUploaded={handleUploaded} />
        ) : (
          <div className="space-y-4">
            <VideoMetaBar video={video} />
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Project name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">AI prompt (optional — you can edit later)</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Make this a viral TikTok edit with fast cuts and emoji subtitles."
                rows={4}
                maxLength={1000}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setVideo(null)}>Choose another file</Button>
              <Button onClick={create} disabled={creating} className="bg-primary-gradient text-primary-foreground shadow-glow">
                {creating ? "Creating…" : "Create project"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
