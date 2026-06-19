import { Wand2, Scissors, Type, Music, Sparkles, Upload, Download, Brain } from "lucide-react";

const features = [
  { icon: Upload, title: "Drag & drop upload", body: "Any MP4, MOV, AVI or MKV — we read duration, resolution, and FPS instantly." },
  { icon: Brain, title: "Smart analysis", body: "Detects faces, emotions, silences and best moments to keep the cut tight." },
  { icon: Scissors, title: "Auto cut", body: "Removes ums, dead air and repeats. Tight pacing without lifting a finger." },
  { icon: Type, title: "AI subtitles", body: "TikTok, Gaming, Podcast or Minimal — burned-in styles ready to ship." },
  { icon: Music, title: "Beat sync", body: "Transitions land exactly on the drop. We analyze BPM and beat for you." },
  { icon: Wand2, title: "Prompt-first agent", body: "Type your vibe — “MrBeast zooms” — and the AI handles the rest." },
  { icon: Sparkles, title: "Premium effects", body: "Speed ramps, shakes, RGB split, motion blur. Curated, not gimmicky." },
  { icon: Download, title: "Multi-format export", body: "TikTok, Reels, Shorts. 720p, 1080p and beyond." },
];

export function Features() {
  return (
    <section id="features" className="relative border-b border-border-subtle px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-xs uppercase tracking-[0.2em] text-primary">Features</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            One editor. Every viral format.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Everything you need to go from a raw recording to a polished short — without opening a timeline.
          </p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border bg-border/60 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="bg-surface p-6">
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-elevated text-primary ring-1 ring-border">
                <f.icon className="h-4 w-4" />
              </div>
              <h3 className="font-display text-base font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
