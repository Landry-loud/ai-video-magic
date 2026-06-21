// AI Plan + Analysis + Scores panels.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Wand2, Hash, Type, Image as ImageIcon, Music2, Camera, Film, Activity, Smile, Eye, Mic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { generateEditingPlan, runAnalysis, type EditingPlan, type Analysis } from "@/lib/aiAgent.functions";
import { toast } from "sonner";

export function AIPlanPanel({
  projectId,
  prompt,
  onPromptChange,
  videoMeta,
}: {
  projectId: string;
  prompt: string;
  onPromptChange: (p: string) => void;
  videoMeta?: { durationSec?: number; width?: number; height?: number; filename?: string };
}) {
  const [plan, setPlan] = useState<EditingPlan | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const qc = useQueryClient();
  const generate = useServerFn(generateEditingPlan);
  const analyze = useServerFn(runAnalysis);

  const planMut = useMutation({
    mutationFn: async () => generate({ data: { projectId, prompt, videoMeta } }),
    onSuccess: (p) => { setPlan(p); analysisMut.mutate(); qc.invalidateQueries({ queryKey: ["credits"] }); qc.invalidateQueries({ queryKey: ["billing"] }); },
    onError: (e: Error) => toast.error(e.message || "AI failed"),
  });
  const analysisMut = useMutation({
    mutationFn: async () => analyze({ data: { projectId, prompt } }),
    onSuccess: (a) => { setAnalysis(a); qc.invalidateQueries({ queryKey: ["credits"] }); },
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border-subtle p-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary-gradient shadow-glow">
            <Wand2 className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <h3 className="font-display text-sm font-semibold">AI Agent</h3>
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder='"MrBeast-style with fast zooms and emoji captions"'
          className="resize-none bg-background text-sm"
        />
        <Button
          onClick={() => planMut.mutate()}
          disabled={!prompt.trim() || planMut.isPending}
          className="mt-3 w-full bg-primary-gradient text-primary-foreground shadow-glow"
        >
          {planMut.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Thinking…</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate editing plan</>}
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-4">
        {!plan && !planMut.isPending && (
          <div className="grid h-full place-items-center text-center text-xs text-muted-foreground">
            <div>
              <Sparkles className="mx-auto h-6 w-6 text-muted-foreground/50" />
              <p className="mt-2">Describe the edit, then let the AI build a plan.<br />Strategy, scores, captions, hashtags.</p>
            </div>
          </div>
        )}
        {plan && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Section title="Strategy"><p className="text-sm text-foreground/90">{plan.strategy}</p></Section>
            <Section title="Hook" icon={<Sparkles className="h-3 w-3" />}><p className="text-sm italic text-foreground">"{plan.hook}"</p></Section>

            <Scores plan={plan} />

            <Section title="Story pacing"><p className="text-sm text-foreground/80">{plan.storyPacing}</p></Section>

            <Section title="Camera zooms" icon={<Camera className="h-3 w-3" />}>
              <ul className="space-y-1 text-sm">{plan.cameraZooms.map((z, i) => <li key={i} className="text-foreground/80">• {z}</li>)}</ul>
            </Section>

            <Section title="Transitions" icon={<Film className="h-3 w-3" />}>
              <div className="flex flex-wrap gap-1.5">{plan.transitions.map((t) => <Badge key={t} variant="outline" className="font-normal">{t}</Badge>)}</div>
            </Section>

            <Section title="Music mood" icon={<Music2 className="h-3 w-3" />}><p className="text-sm text-foreground/80">{plan.musicMood}</p></Section>

            <Section title="Thumbnail idea" icon={<ImageIcon className="h-3 w-3" />}><p className="text-sm text-foreground/80">{plan.thumbnailIdea}</p></Section>

            <Section title="YouTube title" icon={<Type className="h-3 w-3" />}>
              <div className="rounded-md border border-border bg-elevated/40 p-2.5 text-sm font-medium">{plan.youtubeTitle}</div>
            </Section>

            <Section title="TikTok caption">
              <div className="rounded-md border border-border bg-elevated/40 p-2.5 text-sm">{plan.tiktokCaption}</div>
            </Section>

            <Section title="Hashtags" icon={<Hash className="h-3 w-3" />}>
              <div className="flex flex-wrap gap-1.5">{plan.hashtags.map((h) => (
                <span key={h} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">#{h.replace(/^#/, "")}</span>
              ))}</div>
            </Section>

            <AnalysisCards data={analysis} loading={analysisMut.isPending} />
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}{title}
      </div>
      {children}
    </div>
  );
}

function Scores({ plan }: { plan: EditingPlan }) {
  const items = [
    { label: "Overall", value: plan.overallScore, color: "text-primary" },
    { label: "Virality", value: plan.viralScore, color: "text-success" },
    { label: "Retention", value: plan.retentionScore, color: "text-warning" },
    { label: "Hook", value: plan.hookQuality, color: "text-primary" },
    { label: "Rhythm", value: plan.rhythmScore, color: "text-success" },
    { label: "Subtitles", value: plan.subtitleQuality, color: "text-warning" },
  ];
  return (
    <Section title="AI Score">
      <div className="grid grid-cols-3 gap-2">
        {items.map((it) => <ScoreRing key={it.label} {...it} />)}
      </div>
    </Section>
  );
}

function ScoreRing({ label, value, color }: { label: string; value: number; color: string }) {
  const r = 22, c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-elevated/40 p-2">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} stroke="currentColor" strokeWidth="4" fill="none" className="text-border" />
        <circle cx="28" cy="28" r={r} stroke="currentColor" strokeWidth="4" fill="none"
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round" className={color} />
      </svg>
      <div className="-mt-9 text-center text-sm font-semibold text-foreground">{Math.round(value)}</div>
      <div className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function AnalysisCards({ data, loading }: { data: Analysis | null; loading: boolean }) {
  if (!data && !loading) return null;
  if (loading || !data) return (
    <Section title="AI Analysis" icon={<Activity className="h-3 w-3" />}>
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-elevated/40" />
        ))}
      </div>
    </Section>
  );
  const cards = [
    { icon: <Mic className="h-3.5 w-3.5" />, label: "Speaking", value: `${Math.round(data.speakingPct)}%`, p: data.speakingPct },
    { icon: <Smile className="h-3.5 w-3.5" />, label: "Faces", value: `${Math.round(data.facesPct)}%`, p: data.facesPct },
    { icon: <Sparkles className="h-3.5 w-3.5" />, label: "Highlights", value: `${data.highlights}`, p: (data.highlights / 10) * 100 },
    { icon: <Eye className="h-3.5 w-3.5" />, label: "Silence", value: `${Math.round(data.silencePct)}%`, p: data.silencePct },
    { icon: <Activity className="h-3.5 w-3.5" />, label: "Energy", value: `${Math.round(data.energy)}%`, p: data.energy },
    { icon: <Music2 className="h-3.5 w-3.5" />, label: "Music conf.", value: `${Math.round(data.musicConfidence)}%`, p: data.musicConfidence },
  ];
  return (
    <Section title="AI Analysis" icon={<Activity className="h-3 w-3" />}>
      <div className="grid grid-cols-2 gap-2">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-elevated/40 p-2.5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="flex items-center gap-1">{c.icon}{c.label}</span>
              <span className="text-foreground">{c.value}</span>
            </div>
            <Progress value={Math.min(100, c.p)} className="mt-1.5 h-1" />
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Emotion</span>
        <Badge variant="outline" className="capitalize">{data.emotion}</Badge>
      </div>
      {data.notes.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {data.notes.map((n, i) => <li key={i}>• {n}</li>)}
        </ul>
      )}
    </Section>
  );
}
