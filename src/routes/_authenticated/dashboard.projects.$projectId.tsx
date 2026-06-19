import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Captions, Download, Play, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { generateSubtitles, requestEditRender, getSignedUrl } from "@/services/videoProcessing";
import type { ExportResolution, SubtitleStyle } from "@/services/types";
import { toast } from "sonner";
import { msToTimecode } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/projects/$projectId")({
  head: () => ({ meta: [{ title: "Project — AI Edit Studio" }] }),
  component: ProjectPage,
});

function ProjectPage() {
  const { projectId } = useParams({ from: "/_authenticated/dashboard/projects/$projectId" });
  const qc = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, prompt, status, subtitle_style, videos(id, storage_path, duration_sec, width, height, filename)")
        .eq("id", projectId)
        .maybeSingle();
      return data;
    },
  });

  const [videoUrl, setVideoUrl] = useState<string>("");
  useEffect(() => {
    if (project?.videos?.storage_path) {
      getSignedUrl(project.videos.storage_path).then(setVideoUrl);
    }
  }, [project?.videos?.storage_path]);

  const [prompt, setPrompt] = useState("");
  const [savedPrompt, setSavedPrompt] = useState("");
  useEffect(() => { if (project?.prompt != null) { setPrompt(project.prompt); setSavedPrompt(project.prompt); } }, [project?.prompt]);

  const savePrompt = async () => {
    await supabase.from("projects").update({ prompt }).eq("id", projectId);
    setSavedPrompt(prompt);
    toast.success("Prompt saved");
  };

  const [subStyle, setSubStyle] = useState<SubtitleStyle>("tiktok");
  useEffect(() => { if (project?.subtitle_style) setSubStyle(project.subtitle_style as SubtitleStyle); }, [project?.subtitle_style]);
  const updateSubStyle = async (s: SubtitleStyle) => { setSubStyle(s); await supabase.from("projects").update({ subtitle_style: s }).eq("id", projectId); };

  // Subtitles
  const { data: subtitles, refetch: refetchSubs } = useQuery({
    queryKey: ["subtitles", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("subtitles").select("*").eq("project_id", projectId).order("order_index");
      return data ?? [];
    },
  });

  // Jobs (poll while active)
  const { data: jobs } = useQuery({
    queryKey: ["jobs", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("processing_jobs").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: (q) => {
      const list = (q.state.data as any[] | undefined) ?? [];
      const active = list.some((j) => j.status === "queued" || j.status === "processing");
      return active ? 1500 : false;
    },
  });

  const transcribeJob = jobs?.find((j) => j.kind === "transcribe");
  const renderJob = jobs?.find((j) => j.kind === "render");

  useEffect(() => {
    if (transcribeJob?.status === "completed") { refetchSubs(); qc.invalidateQueries({ queryKey: ["jobs", projectId] }); }
  }, [transcribeJob?.status, projectId, qc, refetchSubs]);

  const runTranscribe = async () => {
    await generateSubtitles(projectId);
    toast.info("Transcribing…");
    qc.invalidateQueries({ queryKey: ["jobs", projectId] });
  };

  const [resolution, setResolution] = useState<ExportResolution>("1080p");
  const [burn, setBurn] = useState(true);
  const runRender = async () => {
    await requestEditRender(projectId, { resolution, burnSubtitles: burn, subtitleStyle: subStyle });
    toast.info("Rendering…");
    qc.invalidateQueries({ queryKey: ["jobs", projectId] });
  };

  const subtitleStyleClass = useMemo(() => SUB_PREVIEW[subStyle], [subStyle]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/dashboard/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All projects
        </Link>
        <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          {project?.status ?? "loading"}
        </span>
      </div>

      <div>
        <h1 className="font-display text-2xl font-semibold">{project?.name ?? "Loading…"}</h1>
        <p className="text-sm text-muted-foreground">{project?.videos?.filename}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Left: video + subtitles */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            <div className="relative aspect-video bg-black">
              {videoUrl ? (
                <video src={videoUrl} controls className="h-full w-full object-contain" />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground"><Play className="h-8 w-8" /></div>
              )}
              {(subtitles?.length ?? 0) > 0 && (
                <div className={`pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 ${subtitleStyleClass}`}>
                  {subtitles?.[0]?.text}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold"><Captions className="h-4 w-4 text-primary" /> Subtitles</h2>
              <Button size="sm" variant="outline" onClick={runTranscribe} disabled={transcribeJob?.status === "processing" || transcribeJob?.status === "queued"}>
                {transcribeJob?.status === "processing" || transcribeJob?.status === "queued" ? "Transcribing…" : subtitles && subtitles.length > 0 ? "Re-transcribe" : "Generate"}
              </Button>
            </div>
            {transcribeJob && (transcribeJob.status === "queued" || transcribeJob.status === "processing") && (
              <Progress value={transcribeJob.progress} className="mb-3 h-1.5" />
            )}
            {subtitles && subtitles.length > 0 ? (
              <ul className="max-h-64 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
                {subtitles.map((s) => (
                  <SubtitleRow key={s.id} cue={s} onUpdate={refetchSubs} />
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-border bg-background/40 p-6 text-center text-sm text-muted-foreground">
                Generate AI subtitles from your video's audio.
              </p>
            )}
          </div>
        </div>

        {/* Right: prompt + style + export */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold"><Wand2 className="h-4 w-4 text-primary" /> AI Agent</h2>
            <p className="mt-1 text-xs text-muted-foreground">Describe the edit you want. Plain English works best.</p>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              maxLength={1000}
              placeholder='e.g. "MrBeast-style with fast zooms, big emoji captions, drop on the chorus."'
              className="mt-3"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{prompt.length} / 1000</span>
              <Button size="sm" onClick={savePrompt} disabled={prompt === savedPrompt} className="bg-primary-gradient text-primary-foreground shadow-glow">
                Save prompt
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <h2 className="font-display text-base font-semibold">Subtitle style</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["tiktok", "minimal", "gaming", "podcast"] as SubtitleStyle[]).map((s) => (
                <button
                  key={s}
                  onClick={() => updateSubStyle(s)}
                  className={`rounded-lg border p-3 text-left text-sm capitalize transition-colors ${
                    subStyle === s ? "border-primary/60 bg-primary/10 text-foreground" : "border-border bg-elevated/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold"><Download className="h-4 w-4 text-primary" /> Export</h2>
            <div className="mt-3 space-y-3">
              <div className="space-y-1.5">
                <Label>Resolution</Label>
                <Select value={resolution} onValueChange={(v) => setResolution(v as ExportResolution)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="720p">720p — fast preview</SelectItem>
                    <SelectItem value="1080p">1080p — recommended</SelectItem>
                    <SelectItem value="2k" disabled>2K — Pro plan</SelectItem>
                    <SelectItem value="4k" disabled>4K — Agency plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-elevated/40 p-3">
                <div>
                  <div className="text-sm">Burn subtitles into video</div>
                  <div className="text-xs text-muted-foreground">Hard-coded captions for socials</div>
                </div>
                <Switch checked={burn} onCheckedChange={setBurn} />
              </div>
              {renderJob && (renderJob.status === "queued" || renderJob.status === "processing") ? (
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">Rendering… {renderJob.progress}%</div>
                  <Progress value={renderJob.progress} className="h-1.5" />
                </div>
              ) : (
                <Button onClick={runRender} className="w-full bg-primary-gradient text-primary-foreground shadow-glow">
                  Render export
                </Button>
              )}
              {renderJob?.status === "completed" && (
                <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success">
                  Export ready — download from Library.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubtitleRow({ cue, onUpdate }: { cue: any; onUpdate: () => void }) {
  const [text, setText] = useState(cue.text);
  const [editing, setEditing] = useState(false);
  const save = async () => {
    await supabase.from("subtitles").update({ text }).eq("id", cue.id);
    setEditing(false);
    onUpdate();
  };
  return (
    <li className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-elevated/50">
      <span className="mt-0.5 shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">{msToTimecode(cue.start_ms)}</span>
      {editing ? (
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setText(cue.text); setEditing(false); } }}
          className="min-w-0 flex-1 rounded-md border border-primary/40 bg-background px-2 py-1 text-sm outline-none"
        />
      ) : (
        <button onClick={() => setEditing(true)} className="min-w-0 flex-1 text-left text-sm text-foreground">{text}</button>
      )}
    </li>
  );
}

const SUB_PREVIEW: Record<SubtitleStyle, string> = {
  tiktok: "max-w-[80%] rounded-md bg-black/80 px-3 py-1 text-center text-base font-extrabold uppercase text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.9)]",
  minimal: "max-w-[80%] text-center text-sm text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]",
  gaming: "max-w-[80%] rounded-md bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-3 py-1 text-center text-base font-black uppercase text-white",
  podcast: "max-w-[80%] rounded-md bg-white/95 px-3 py-1 text-center text-sm font-medium text-black",
};
