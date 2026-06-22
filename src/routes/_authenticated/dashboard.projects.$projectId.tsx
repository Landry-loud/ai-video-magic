import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle } from "react-resizable-panels";
import { ArrowLeft, Wand2, Bot, SlidersHorizontal, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { generateSubtitles, requestEditRender, getSignedUrl } from "@/services/videoProcessing";
import type { ExportResolution, SubtitleStyle } from "@/services/types";
import { toast } from "sonner";

import { LivePreview, type AspectRatio } from "@/components/workspace/LivePreview";
import { Timeline } from "@/components/workspace/Timeline";
import { AssetsPanel } from "@/components/workspace/AssetsPanel";
import { AIPlanPanel } from "@/components/workspace/AIPlanPanel";
import { CopilotPanel } from "@/components/workspace/CopilotPanel";
import { ExportPanel, StylesPanel } from "@/components/workspace/ExportPanel";

export const Route = createFileRoute("/_authenticated/dashboard/projects/$projectId")({
  head: () => ({ meta: [{ title: "Project — AI Edit Studio" }] }),
  component: ProjectWorkspace,
});

function ProjectWorkspace() {
  const { projectId } = useParams({ from: "/_authenticated/dashboard/projects/$projectId" });
  const qc = useQueryClient();

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, prompt, status, subtitle_style, videos(id, storage_path, duration_sec, width, height, filename)")
        .eq("id", projectId).maybeSingle();
      return data;
    },
  });

  const [videoUrl, setVideoUrl] = useState("");
  useEffect(() => {
    if (project?.videos?.storage_path) getSignedUrl(project.videos.storage_path).then(setVideoUrl);
  }, [project?.videos?.storage_path]);

  // prompt (persisted on blur of the panel save)
  const [prompt, setPrompt] = useState("");
  useEffect(() => { if (project?.prompt != null) setPrompt(project.prompt); }, [project?.prompt]);
  useEffect(() => {
    if (project?.prompt == null) return;
    const t = setTimeout(() => { void supabase.from("projects").update({ prompt }).eq("id", projectId); }, 600);
    return () => clearTimeout(t);
  }, [prompt, project?.prompt, projectId]);

  // subtitle style
  const [subStyle, setSubStyle] = useState<SubtitleStyle>("tiktok");
  useEffect(() => { if (project?.subtitle_style) setSubStyle(project.subtitle_style as SubtitleStyle); }, [project?.subtitle_style]);
  const changeStyle = async (s: SubtitleStyle) => { setSubStyle(s); await supabase.from("projects").update({ subtitle_style: s }).eq("id", projectId); };

  // cues
  const { data: subs, refetch: refetchSubs } = useQuery({
    queryKey: ["subtitles", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("subtitles").select("*").eq("project_id", projectId).order("order_index");
      return data ?? [];
    },
  });
  const cues = subs ?? [];

  // jobs
  const { data: jobs } = useQuery({
    queryKey: ["jobs", projectId],
    queryFn: async () => {
      const { data } = await supabase.from("processing_jobs").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: (q) => {
      const list = (q.state.data as { status: string }[] | undefined) ?? [];
      return list.some((j) => j.status === "queued" || j.status === "processing") ? 1500 : false;
    },
  });
  const transcribeJob = jobs?.find((j) => j.kind === "transcribe");
  const renderJob = jobs?.find((j) => j.kind === "render");

  useEffect(() => {
    if (transcribeJob?.status === "completed") { void refetchSubs(); qc.invalidateQueries({ queryKey: ["jobs", projectId] }); }
  }, [transcribeJob?.status, projectId, qc, refetchSubs]);

  const runTranscribe = async () => { await generateSubtitles(projectId); toast.info("Transcribing…"); qc.invalidateQueries({ queryKey: ["jobs", projectId] }); };

  // export
  const [resolution, setResolution] = useState<ExportResolution>("1080p");
  const [burn, setBurn] = useState(true);
  const [destination, setDestination] = useState("tiktok");
  const runRender = async () => {
    await requestEditRender(projectId, { resolution, burnSubtitles: burn, subtitleStyle: subStyle } as never);
    toast.info("Rendering…");
    qc.invalidateQueries({ queryKey: ["jobs", projectId] });
  };

  // preview
  const [ratio, setRatio] = useState<AspectRatio>("9:16");
  const [showSafe, setShowSafe] = useState(false);

  const videoMeta = useMemo(() => project?.videos ? {
    durationSec: project.videos.duration_sec ?? undefined,
    width: project.videos.width ?? undefined,
    height: project.videos.height ?? undefined,
    filename: project.videos.filename,
  } : undefined, [project?.videos]);

  const copilotContext = useMemo(() => [
    `Project name: ${project?.name ?? "untitled"}`,
    `Status: ${project?.status ?? "draft"}`,
    `Video: ${project?.videos?.filename ?? "n/a"} (${project?.videos?.duration_sec ?? "?"}s, ${project?.videos?.width ?? "?"}x${project?.videos?.height ?? "?"})`,
    `Subtitle style: ${subStyle}`,
    `Subtitles: ${cues.length} cues`,
    `Creator brief: ${prompt || "(none)"}`,
  ].join("\n"), [project, subStyle, cues.length, prompt]);

  return (
    <div className="-m-6 flex h-[calc(100vh-3.5rem)] flex-col">
      {/* workspace header */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border-subtle bg-background px-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/dashboard/projects" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Projects
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{project?.name ?? "Loading…"}</div>
          </div>
          <span className="rounded-full bg-elevated px-2 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">{project?.status ?? "—"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setShowSafe((s) => !s)} className="h-7 text-xs">
            {showSafe ? "Hide safe area" : "Show safe area"}
          </Button>
          <Button size="sm" onClick={runRender} className="h-7 bg-primary-gradient text-primary-foreground">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* main */}
      <PanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <Panel defaultSize={18} minSize={14} className="border-r border-border-subtle bg-surface">
          <AssetsPanel
            projectId={projectId}
            video={project?.videos ?? undefined}
            cues={cues}
            onCuesChange={() => refetchSubs()}
            onTranscribe={runTranscribe}
            transcribing={transcribeJob?.status === "processing" || transcribeJob?.status === "queued"}
          />
        </Panel>
        <PanelResizeHandle className="w-px bg-border-subtle hover:bg-primary/50" />

        <Panel defaultSize={56} minSize={36}>
          <PanelGroup orientation="vertical">
            <Panel defaultSize={65} minSize={30} className="bg-background">
              <LivePreview
                url={videoUrl}
                cues={cues}
                subtitleStyle={subStyle}
                showSafe={showSafe}
                ratio={ratio}
                onRatioChange={setRatio}
              />
            </Panel>
            <PanelResizeHandle className="h-px bg-border-subtle hover:bg-primary/50" />
            <Panel defaultSize={35} minSize={20}>
              <Timeline durationSec={project?.videos?.duration_sec ?? 60} cues={cues} />
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="w-px bg-border-subtle hover:bg-primary/50" />
        <Panel defaultSize={26} minSize={20} className="border-l border-border-subtle bg-surface">
          <Tabs defaultValue="plan" className="flex h-full min-h-0 flex-col">
            <TabsList className="m-2 h-9 shrink-0 bg-elevated/50">
              <TabsTrigger value="plan" className="text-xs"><Wand2 className="mr-1.5 h-3 w-3" />Plan</TabsTrigger>
              <TabsTrigger value="copilot" className="text-xs"><Bot className="mr-1.5 h-3 w-3" />Copilot</TabsTrigger>
              <TabsTrigger value="styles" className="text-xs"><SlidersHorizontal className="mr-1.5 h-3 w-3" />Styles</TabsTrigger>
              <TabsTrigger value="export" className="text-xs"><Download className="mr-1.5 h-3 w-3" />Export</TabsTrigger>
            </TabsList>
            <div className="min-h-0 flex-1">
              <TabsContent value="plan" className="m-0 h-full"><AIPlanPanel projectId={projectId} prompt={prompt} onPromptChange={setPrompt} videoMeta={videoMeta} /></TabsContent>
              <TabsContent value="copilot" className="m-0 h-full"><CopilotPanel projectContext={copilotContext} /></TabsContent>
              <TabsContent value="styles" className="m-0 h-full"><StylesPanel value={subStyle} onChange={changeStyle} /></TabsContent>
              <TabsContent value="export" className="m-0 h-full">
                <ExportPanel
                  resolution={resolution} setResolution={setResolution}
                  burn={burn} setBurn={setBurn}
                  destination={destination} setDestination={setDestination}
                  durationSec={project?.videos?.duration_sec ?? 0}
                  onRender={runRender} renderJob={renderJob ?? null}
                />
              </TabsContent>
            </div>
          </Tabs>
        </Panel>
      </PanelGroup>
    </div>
  );
}
