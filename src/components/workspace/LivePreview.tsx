// Live preview player — aspect ratios, frame stepping, subtitle overlay, safe margins.
import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Maximize2, Frame } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SubtitleStyle } from "@/services/types";

export type AspectRatio = "9:16" | "16:9" | "1:1" | "4:5";

const RATIO_CLASSES: Record<AspectRatio, string> = {
  "9:16": "aspect-[9/16]",
  "16:9": "aspect-video",
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
};

interface Cue { start_ms: number; end_ms: number; text: string }

export function LivePreview({
  url,
  cues,
  subtitleStyle,
  showSafe,
  ratio,
  onRatioChange,
}: {
  url: string;
  cues: Cue[];
  subtitleStyle: SubtitleStyle;
  showSafe: boolean;
  ratio: AspectRatio;
  onRatioChange: (r: AspectRatio) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);

  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setTime(v.currentTime);
    const onLoad = () => setDur(v.duration || 0);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onLoad);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onLoad);
    };
  }, [url]);

  const toggle = () => { const v = videoRef.current; if (!v) return; v.paused ? v.play() : v.pause(); };
  const step = (sec: number) => { const v = videoRef.current; if (!v) return; v.currentTime = Math.max(0, Math.min((v.duration || 0), v.currentTime + sec)); };

  const activeCue = cues.find((c) => time * 1000 >= c.start_ms && time * 1000 <= c.end_ms);

  return (
    <div className="flex h-full w-full flex-col">
      {/* toolbar */}
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
        <div className="flex gap-1 rounded-md border border-border bg-elevated/40 p-0.5 text-[11px]">
          {(["9:16", "1:1", "4:5", "16:9"] as AspectRatio[]).map((r) => (
            <button
              key={r}
              onClick={() => onRatioChange(r)}
              className={`rounded px-2 py-0.5 transition-colors ${ratio === r ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >{r}</button>
          ))}
        </div>
        <div className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {fmt(time)} / {fmt(dur)}
        </div>
      </div>

      {/* stage */}
      <div className="grid min-h-0 flex-1 place-items-center bg-black/60 p-4">
        <div className={`relative ${RATIO_CLASSES[ratio]} h-full max-h-full max-w-full overflow-hidden rounded-lg bg-black shadow-elevated`}>
          {url ? (
            <video ref={videoRef} src={url} className="h-full w-full object-contain" />
          ) : (
            <div className="grid h-full place-items-center text-muted-foreground"><Frame className="h-8 w-8" /></div>
          )}
          {showSafe && <SafeMargins />}
          {activeCue && (
            <div className={`pointer-events-none absolute bottom-[8%] left-1/2 -translate-x-1/2 ${SUB_PREVIEW[subtitleStyle]}`}>
              {activeCue.text}
            </div>
          )}
        </div>
      </div>

      {/* transport */}
      <div className="flex items-center gap-2 border-t border-border-subtle px-3 py-2">
        <Button size="icon" variant="ghost" onClick={() => step(-1 / 30)} title="Previous frame"><SkipBack className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" onClick={toggle} className="text-foreground">
          {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <Button size="icon" variant="ghost" onClick={() => step(1 / 30)} title="Next frame"><SkipForward className="h-4 w-4" /></Button>
        <input
          type="range" min={0} max={dur || 0} step={0.01} value={time}
          onChange={(e) => { const v = videoRef.current; if (v) v.currentTime = parseFloat(e.target.value); }}
          className="mx-2 h-1 flex-1 cursor-pointer appearance-none rounded bg-elevated accent-primary"
        />
        <Button size="icon" variant="ghost" onClick={() => videoRef.current?.requestFullscreen()}><Maximize2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

function SafeMargins() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-[5%] border border-warning/30" />
      <div className="absolute inset-[10%] border border-success/20 border-dashed" />
    </div>
  );
}

export const SUB_PREVIEW: Record<SubtitleStyle, string> = {
  tiktok: "max-w-[80%] rounded-md bg-black/85 px-3 py-1 text-center text-base font-extrabold uppercase text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.9)]",
  minimal: "max-w-[80%] text-center text-sm text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]",
  gaming: "max-w-[80%] rounded-md bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-3 py-1 text-center text-base font-black uppercase text-white",
  podcast: "max-w-[80%] rounded-md bg-white/95 px-3 py-1 text-center text-sm font-medium text-black",
};

function fmt(s: number) {
  if (!Number.isFinite(s)) return "00:00.00";
  const m = Math.floor(s / 60), sec = s - m * 60;
  return `${String(m).padStart(2, "0")}:${sec.toFixed(2).padStart(5, "0")}`;
}
