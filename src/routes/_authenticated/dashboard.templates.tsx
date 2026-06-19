import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/templates")({
  head: () => ({ meta: [{ title: "Templates — AI Edit Studio" }] }),
  component: TemplatesPage,
});

const TEMPLATES = [
  { name: "TikTok Viral", prompt: "Fast-paced TikTok cut with bold burned-in captions and rhythmic cuts on the beat.", gradient: "from-pink-500/40 to-orange-500/30" },
  { name: "MrBeast", prompt: "MrBeast-style edit: punchy zooms every 2-3s, bright captions, energetic pacing, big reactions.", gradient: "from-red-500/40 to-yellow-400/30" },
  { name: "L2B", prompt: "L2B-style edit: cinematic transitions, light leaks, glow, dramatic slow-mo on highlights.", gradient: "from-blue-500/40 to-cyan-300/30" },
  { name: "Cinematic", prompt: "Cinematic 16:9 trailer with slow pans, color grade (warm shadows, teal highlights), ambient bed.", gradient: "from-amber-500/40 to-rose-500/30" },
  { name: "Podcast", prompt: "Podcast highlight clip: speaker name lower-third, clean two-line captions, subtle b-roll cuts.", gradient: "from-indigo-500/40 to-violet-500/30" },
  { name: "Gaming", prompt: "Gaming montage synced to the drop, RGB split on hits, glitch transitions, bold tag captions.", gradient: "from-emerald-500/40 to-lime-400/30" },
  { name: "Anime", prompt: "Anime-style overlays, speed ramps on action, kinetic captions, vibrant color boost.", gradient: "from-fuchsia-500/40 to-sky-400/30" },
  { name: "Football", prompt: "Football highlight: ramp on the strike, replay overlay, stadium ambience, stat lower-thirds.", gradient: "from-green-500/40 to-yellow-400/30" },
  { name: "Motivation", prompt: "Motivational reel: quote captions, slow build-up, drop on the hook, warm grade.", gradient: "from-orange-500/40 to-red-500/30" },
  { name: "Luxury", prompt: "Luxury brand edit: minimal serif captions, slow gliding cam, gold accents, ambient score.", gradient: "from-yellow-500/40 to-zinc-400/30" },
];

function TemplatesPage() {
  const navigate = useNavigate();
  const start = async (t: typeof TEMPLATES[number]) => {
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("projects")
        .insert({ user_id: u.user.id, name: `${t.name} edit`, prompt: t.prompt, style: t.name, status: "draft" })
        .select().single();
      if (error) throw error;
      toast.success(`${t.name} project drafted`);
      navigate({ to: "/dashboard/projects/$projectId", params: { projectId: data.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Templates</h1>
        <p className="mt-1 text-sm text-muted-foreground">One-tap starting points. Pick a style — upload your video next.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <button
            key={t.name}
            onClick={() => start(t)}
            className="group overflow-hidden rounded-2xl border border-border bg-surface text-left shadow-card transition-colors hover:border-primary/40"
          >
            <div className={`relative aspect-video bg-gradient-to-br ${t.gradient}`}>
              <div className="absolute inset-0 grid-bg opacity-50" />
              <div className="absolute bottom-3 left-4 font-display text-2xl font-bold text-white drop-shadow">{t.name}</div>
            </div>
            <div className="p-4">
              <p className="line-clamp-2 text-xs text-muted-foreground">{t.prompt}</p>
              <div className="mt-3 text-xs font-medium text-primary group-hover:translate-x-0.5 transition-transform">Start with this →</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
