// Professional timeline — video / audio / subtitle tracks + ruler + playhead.
// Visual-only for now; architected so a future renderer can drive currentTime.

import { useMemo, useState } from "react";
import { ZoomIn, ZoomOut, Layers, Music2, Captions, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Cue { id: string; start_ms: number; end_ms: number; text: string }

export function Timeline({
  durationSec,
  cues,
  currentSec = 0,
  onSeek,
}: {
  durationSec: number;
  cues: Cue[];
  currentSec?: number;
  onSeek?: (sec: number) => void;
}) {
  const [pxPerSec, setPxPerSec] = useState(40);
  const totalWidth = Math.max(800, Math.ceil((durationSec || 60) * pxPerSec));

  const ticks = useMemo(() => {
    const step = pxPerSec >= 60 ? 1 : pxPerSec >= 30 ? 2 : 5;
    const out: number[] = [];
    for (let s = 0; s <= (durationSec || 60); s += step) out.push(s);
    return out;
  }, [durationSec, pxPerSec]);

  const playheadPx = currentSec * pxPerSec;

  const onTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + e.currentTarget.scrollLeft;
    onSeek(x / pxPerSec);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      {/* header */}
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5" /> Timeline
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => setPxPerSec((p) => Math.max(10, p - 10))}><ZoomOut className="h-3.5 w-3.5" /></Button>
          <span className="w-12 text-center font-mono text-[10px] text-muted-foreground">{pxPerSec}px/s</span>
          <Button size="icon" variant="ghost" onClick={() => setPxPerSec((p) => Math.min(160, p + 10))}><ZoomIn className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {/* scroll body */}
      <div className="relative flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin" onClick={onTrackClick}>
        <div style={{ width: totalWidth }} className="relative">
          {/* ruler */}
          <div className="sticky top-0 z-10 flex h-6 select-none items-end border-b border-border-subtle bg-surface text-[10px] text-muted-foreground">
            {ticks.map((s) => (
              <div key={s} style={{ left: s * pxPerSec }} className="absolute flex h-full flex-col justify-end pl-1">
                <span className="font-mono leading-none">{fmt(s)}</span>
                <div className="mt-0.5 h-2 w-px bg-border" />
              </div>
            ))}
          </div>

          {/* tracks */}
          <Track icon={<Layers className="h-3 w-3" />} label="Video" color="bg-primary/30 border-primary/50">
            <div className="absolute inset-y-1.5 left-0 rounded-md border border-primary/50 bg-primary/15" style={{ width: durationSec * pxPerSec }}>
              <div className="absolute inset-0 flex items-center px-2 text-[10px] font-medium text-foreground/80">Main clip · {fmt(durationSec)}</div>
              {/* fake waveform stripes */}
              <div className="absolute inset-y-1 left-2 right-2 flex items-center gap-[2px] opacity-60">
                {Array.from({ length: Math.min(80, Math.floor(durationSec * 2)) }).map((_, i) => (
                  <div key={i} className="w-[2px] rounded bg-primary/60" style={{ height: `${20 + Math.abs(Math.sin(i * 0.7)) * 70}%` }} />
                ))}
              </div>
            </div>
          </Track>

          <Track icon={<Music2 className="h-3 w-3" />} label="Audio" color="bg-success/20 border-success/40">
            <div className="absolute inset-y-1.5 left-0 rounded-md border border-success/40 bg-success/10" style={{ width: durationSec * pxPerSec }} />
          </Track>

          <Track icon={<Captions className="h-3 w-3" />} label="Subtitles" color="bg-warning/20 border-warning/40">
            {cues.map((c) => {
              const left = (c.start_ms / 1000) * pxPerSec;
              const w = Math.max(20, ((c.end_ms - c.start_ms) / 1000) * pxPerSec);
              return (
                <div
                  key={c.id}
                  style={{ left, width: w }}
                  className="absolute inset-y-2 truncate rounded border border-warning/50 bg-warning/15 px-1.5 text-[10px] font-medium text-warning"
                  title={c.text}
                >
                  {c.text}
                </div>
              );
            })}
          </Track>

          <Track icon={<Flag className="h-3 w-3" />} label="Markers" color="">
            {/* placeholder for future AI markers */}
          </Track>

          {/* playhead */}
          <div className="pointer-events-none absolute top-0 bottom-0 z-20 w-px bg-primary shadow-[0_0_8px_var(--color-primary)]" style={{ left: playheadPx }}>
            <div className="absolute -top-1 -left-1 h-2 w-2 rotate-45 bg-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Track({ icon, label, color: _, children }: { icon: React.ReactNode; label: string; color: string; children?: React.ReactNode }) {
  return (
    <div className="relative flex h-12 items-stretch border-b border-border-subtle">
      <div className="sticky left-0 z-10 flex w-24 shrink-0 items-center gap-1.5 border-r border-border-subtle bg-surface px-2 text-[11px] text-muted-foreground">
        {icon}<span>{label}</span>
      </div>
      <div className="relative flex-1">{children}</div>
    </div>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60), sec = Math.floor(s - m * 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}
