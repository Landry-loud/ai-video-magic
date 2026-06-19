import { Upload, MessageSquare, Sparkles } from "lucide-react";

const steps = [
  { n: "01", icon: Upload, title: "Upload your footage", body: "Drop in a long recording — interview, gameplay, gym set, vlog, livestream replay." },
  { n: "02", icon: MessageSquare, title: "Tell the AI your vibe", body: "“Make it a viral TikTok hook” or “MrBeast-style zooms with fast cuts.”" },
  { n: "03", icon: Sparkles, title: "Get a ready-to-post edit", body: "AI cuts, captions, scores, and exports in TikTok, Reels and Shorts ratios." },
];

export function Workflow() {
  return (
    <section className="border-b border-border-subtle px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-xs uppercase tracking-[0.2em] text-primary">Workflow</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Three steps. No timeline.
          </h2>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-2xl border border-border bg-surface p-7 shadow-card">
              <div className="font-display text-xs text-muted-foreground">{s.n}</div>
              <div className="mt-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-gradient text-primary-foreground shadow-glow">
                <s.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
