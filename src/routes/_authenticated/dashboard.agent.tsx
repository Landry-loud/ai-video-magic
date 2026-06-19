import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Wand2, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUGGESTIONS = [
  "Make this a viral TikTok hook with fast cuts.",
  "MrBeast-style with big zooms and bold subtitles.",
  "Cinematic edit, slow pans, color graded warm.",
  "Podcast highlight — clean cut, name lower-third.",
  "Gaming montage synced to the drop.",
  "Anime-style overlays with speed ramps.",
];

export const Route = createFileRoute("/_authenticated/dashboard/agent")({
  head: () => ({ meta: [{ title: "AI Agent — AI Edit Studio" }] }),
  component: AgentPage,
});

function AgentPage() {
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const submit = async () => {
    if (!prompt.trim()) return toast.error("Describe the edit you want first");
    setSubmitting(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("projects")
        .insert({ user_id: u.user.id, name: prompt.slice(0, 60), prompt, status: "draft" })
        .select().single();
      if (error) throw error;
      toast.success("Project drafted — upload your video to continue");
      navigate({ to: "/dashboard/projects/$projectId", params: { projectId: data.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-gradient shadow-glow">
          <Wand2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-semibold">Tell the AI what you want.</h1>
        <p className="mt-2 text-muted-foreground">Plain English works best. The AI handles cuts, captions, music, and export.</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <Textarea
          autoFocus
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='e.g. "Make this video viral on TikTok. Fast cuts, big emoji captions, drop the bass on the hook."'
          rows={6}
          maxLength={1000}
          className="resize-none bg-background"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{prompt.length} / 1000</span>
          <Button onClick={submit} disabled={submitting} className="bg-primary-gradient text-primary-foreground shadow-glow">
            {submitting ? "Drafting…" : "Draft a project"}
          </Button>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" /> Try
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => setPrompt(s)} className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground">
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
