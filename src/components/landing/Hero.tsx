import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border-subtle">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute inset-0 bg-hero pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-6 pt-32 pb-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm"
        >
          <Sparkles className="h-3 w-3 text-primary" />
          AI-powered video editing for creators
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-7 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight text-gradient sm:text-6xl md:text-7xl"
        >
          Turn raw footage<br />into viral edits.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg"
        >
          Upload a video, write a prompt, and let our AI cut, caption, and export a polished short — ready for TikTok, Reels, and Shorts.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex items-center justify-center gap-3"
        >
          <Link
            to="/auth"
            className="group inline-flex items-center gap-2 rounded-lg bg-primary-gradient px-5 py-3 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:-translate-y-px"
          >
            Start editing free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface/60 px-5 py-3 text-sm font-medium text-foreground backdrop-blur-sm hover:bg-elevated"
          >
            See how it works
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative mx-auto mt-20 max-w-5xl"
        >
          <div className="relative rounded-2xl border border-border bg-surface p-2 shadow-elevated">
            <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-gradient-to-br from-elevated to-surface">
              <MockEditorPreview />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function MockEditorPreview() {
  return (
    <div className="grid h-full grid-cols-[200px_1fr_240px] gap-px bg-border/40 text-[11px]">
      <div className="bg-sidebar p-3">
        <div className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">Projects</div>
        {["Hook viral cut", "Podcast highlight", "Gaming montage", "Travel reel"].map((n, i) => (
          <div key={n} className={`mb-1 rounded-md px-2 py-1.5 ${i === 0 ? "bg-elevated text-foreground" : "text-muted-foreground"}`}>{n}</div>
        ))}
      </div>
      <div className="flex flex-col bg-background">
        <div className="flex-1 grid place-items-center">
          <div className="h-32 w-56 rounded-md bg-gradient-to-br from-primary/30 to-primary-glow/10 ring-1 ring-primary/30 shadow-glow" />
        </div>
        <div className="border-t border-border-subtle bg-surface p-2">
          <div className="flex gap-1">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="h-8 flex-1 rounded-sm" style={{ background: `linear-gradient(180deg, oklch(0.66 0.16 258 / ${0.15 + (i % 5) * 0.12}), transparent)` }} />
            ))}
          </div>
        </div>
      </div>
      <div className="bg-sidebar p-3">
        <div className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">AI Agent</div>
        <div className="rounded-md border border-border bg-elevated p-2 text-foreground">"Make this a MrBeast-style edit with fast zooms."</div>
        <div className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">Subtitles</div>
        <div className="mt-1 space-y-1 text-muted-foreground">
          <div>00:01 — Let's go.</div>
          <div>00:03 — This is huge.</div>
          <div>00:05 — Watch this.</div>
        </div>
      </div>
    </div>
  );
}
