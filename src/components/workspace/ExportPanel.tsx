// Right-side Export panel: advanced render settings + real-time stage progress.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Download, Instagram, Youtube, Music, Sparkles, Lock, ChevronDown, Cpu, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ExportResolution, SubtitleStyle, RenderStage, VideoCodec, AudioQuality } from "@/services/types";
import { STAGE_LABEL } from "@/services/types";
import { useCurrentPlan } from "@/components/billing/RequirePlan";
import { canUseResolution, getPlan } from "@/lib/plans";
import { renderCostCredits } from "@/services/render";

const PRESETS = [
  { id: "tiktok", label: "TikTok", icon: Music, ratio: "9:16", fps: 30 },
  { id: "reels", label: "Reels", icon: Instagram, ratio: "9:16", fps: 30 },
  { id: "shorts", label: "Shorts", icon: Youtube, ratio: "9:16", fps: 60 },
  { id: "square", label: "Square", icon: Sparkles, ratio: "1:1", fps: 30 },
];

interface ExportPanelProps {
  resolution: ExportResolution;
  setResolution: (r: ExportResolution) => void;
  burn: boolean;
  setBurn: (b: boolean) => void;
  destination: string;
  setDestination: (d: string) => void;
  durationSec: number;
  onRender: () => void;
  renderJob?: {
    status: string;
    progress: number;
    stage?: RenderStage | string | null;
    stage_progress?: number;
    worker?: string | null;
    eta_seconds?: number | null;
  } | null;
}

export function ExportPanel({
  resolution, setResolution,
  burn, setBurn,
  destination, setDestination,
  durationSec,
  onRender, renderJob,
}: ExportPanelProps) {
  const { data: plan = "free" } = useCurrentPlan();
  const planName = getPlan(plan).name;
  const allowed = (r: ExportResolution) => canUseResolution(plan, r);

  // Advanced settings (locally controlled; passed to backend on render).
  const [fps, setFps] = useState<24 | 30 | 60>(30);
  const [codec, setCodec] = useState<VideoCodec>("h264");
  const [bitrate, setBitrate] = useState<number>(defaultBitrate(resolution));
  const [audioQuality, setAudioQuality] = useState<AudioQuality>("standard");
  const [preset, setPreset] = useState<"fast" | "balanced" | "quality">("balanced");
  const [hwAccel, setHwAccel] = useState(true);
  const [watermark, setWatermark] = useState(plan === "free");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const estimated = ((bitrate * durationSec) / 8 / 1024).toFixed(1); // MB
  const credits = renderCostCredits({
    resolution, fps, codec, bitrateKbps: bitrate, aspectRatio: "9:16",
    audioQuality, burnSubtitles: burn, subtitleStyle: "tiktok", watermark, hardwareAcceleration: hwAccel,
  });

  const isRunning = renderJob && (renderJob.status === "queued" || renderJob.status === "processing" || renderJob.status === "uploading" || renderJob.status === "preparing" || renderJob.status === "retrying");
  const stageLabel = renderJob?.stage ? (STAGE_LABEL[renderJob.stage as RenderStage] ?? String(renderJob.stage)) : "Queued";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border-subtle p-3">
        <div className="flex items-center gap-1.5 text-sm font-medium"><Download className="h-3.5 w-3.5 text-primary" /> Export</div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto scrollbar-thin p-3">
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Destination</Label>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {PRESETS.map((p) => (
              <button key={p.id} onClick={() => { setDestination(p.id); setFps(p.fps as 30 | 60); }}
                className={`flex items-center gap-1.5 rounded-lg border p-2 text-xs transition-colors ${destination === p.id ? "border-primary/60 bg-primary/10 text-foreground" : "border-border bg-elevated/40 text-muted-foreground hover:text-foreground"}`}>
                <p.icon className="h-3.5 w-3.5" /> {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Resolution</Label>
          <Select value={resolution} onValueChange={(v) => { setResolution(v as ExportResolution); setBitrate(defaultBitrate(v as ExportResolution)); }}>
            <SelectTrigger className="mt-1.5 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="720p">720p — fast preview</SelectItem>
              <SelectItem value="1080p">1080p — recommended</SelectItem>
              <SelectItem value="2k" disabled={!allowed("2k")}>2K {allowed("2k") ? "" : "— Pro plan"}</SelectItem>
              <SelectItem value="4k" disabled={!allowed("4k")}>4K {allowed("4k") ? "" : "— Agency plan"}</SelectItem>
            </SelectContent>
          </Select>
          {!allowed("2k") && (
            <Link to="/dashboard/billing" className="mt-2 flex items-center gap-1.5 text-[11px] text-warning hover:underline">
              <Lock className="h-3 w-3" /> Unlock 2K & 4K with Pro · You're on {planName}
            </Link>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-elevated/40 p-2.5">
          <div>
            <div className="text-sm">Burn subtitles</div>
            <div className="text-[10px] text-muted-foreground">Hard-coded captions</div>
          </div>
          <Switch checked={burn} onCheckedChange={setBurn} />
        </div>

        {/* Advanced settings */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-elevated/30 px-3 py-2 text-xs">
            <span className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-muted-foreground" /> Advanced</span>
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
            <Row2>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">FPS</Label>
                <Select value={String(fps)} onValueChange={(v) => setFps(Number(v) as 24 | 30 | 60)}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                    <SelectItem value="60" disabled={plan === "free"}>60 {plan === "free" ? "— Pro" : ""}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Codec</Label>
                <Select value={codec} onValueChange={(v) => setCodec(v as VideoCodec)}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="h264">H.264</SelectItem>
                    <SelectItem value="h265">H.265 (HEVC)</SelectItem>
                    <SelectItem value="vp9">VP9</SelectItem>
                    <SelectItem value="av1">AV1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Row2>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Bitrate</Label>
                <span className="font-mono text-[10px] text-muted-foreground">{(bitrate / 1000).toFixed(1)} Mbps</span>
              </div>
              <Slider min={1000} max={50000} step={500} value={[bitrate]} onValueChange={([v]) => setBitrate(v)} className="mt-2" />
            </div>

            <Row2>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Audio</Label>
                <Select value={audioQuality} onValueChange={(v) => setAudioQuality(v as AudioQuality)}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">96 kbps</SelectItem>
                    <SelectItem value="standard">192 kbps</SelectItem>
                    <SelectItem value="high">256 kbps</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Preset</Label>
                <Select value={preset} onValueChange={(v) => setPreset(v as typeof preset)}>
                  <SelectTrigger className="mt-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">Fast</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Row2>

            <div className="flex items-center justify-between rounded-lg border border-border bg-elevated/40 px-2.5 py-2 text-xs">
              <span>Hardware acceleration</span>
              <Switch checked={hwAccel} onCheckedChange={setHwAccel} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-elevated/40 px-2.5 py-2 text-xs">
              <span>Watermark {plan === "free" && <span className="ml-1 text-[9px] uppercase text-warning">Free</span>}</span>
              <Switch checked={watermark} onCheckedChange={setWatermark} disabled={plan === "free"} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="rounded-lg border border-border bg-elevated/40 p-3 text-xs">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Estimated</span>
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-primary">{credits} credits</span>
          </div>
          <Row label="Duration" value={`${Math.round(durationSec)}s`} />
          <Row label="Resolution" value={resolution} />
          <Row label="FPS" value={`${fps}`} />
          <Row label="Codec" value={codec.toUpperCase()} />
          <Row label="File size" value={`≈ ${estimated} MB`} />
        </div>

        {isRunning ? (
          <div className="space-y-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-foreground">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                {stageLabel}
              </span>
              <span className="font-mono text-muted-foreground">{renderJob?.progress ?? 0}%</span>
            </div>
            <Progress value={renderJob?.progress ?? 0} className="h-1.5" />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{renderJob?.worker ?? "worker"} · attempt {1}</span>
              {renderJob?.eta_seconds ? <span>~{renderJob.eta_seconds}s left</span> : null}
            </div>
          </div>
        ) : (
          <Button onClick={onRender} className="w-full bg-primary-gradient text-primary-foreground shadow-glow">
            <Download className="mr-2 h-4 w-4" /> Render export · {credits} cr
          </Button>
        )}

        {renderJob?.status === "completed" && (
          <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-xs text-success">
            Export ready — <Link to="/dashboard/renders" className="underline">view in Renders</Link>
          </div>
        )}
        {renderJob?.status === "failed" && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            Render failed. Open Renders to retry.
          </div>
        )}
      </div>
    </div>
  );
}

function defaultBitrate(res: ExportResolution): number {
  return res === "4k" ? 35000 : res === "2k" ? 16000 : res === "1080p" ? 8000 : 5000;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between py-0.5"><span className="text-muted-foreground">{label}</span><span className="font-mono text-foreground">{value}</span></div>;
}
function Row2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

// ---- Subtitle styles picker -----------------------------------------------

const STYLES: { id: SubtitleStyle; label: string; preview: string }[] = [
  { id: "tiktok", label: "TikTok", preview: "BOLD CAPS" },
  { id: "minimal", label: "Minimal", preview: "minimal" },
  { id: "gaming", label: "Gaming", preview: "GG" },
  { id: "podcast", label: "Podcast", preview: "Podcast" },
];

const MORE: { id: string; label: string; locked?: boolean }[] = [
  { id: "mrbeast", label: "MrBeast", locked: true },
  { id: "l2b", label: "L2B", locked: true },
  { id: "anime", label: "Anime", locked: true },
  { id: "luxury", label: "Luxury", locked: true },
];

export function StylesPanel({ value, onChange }: { value: SubtitleStyle; onChange: (s: SubtitleStyle) => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border-subtle p-3 text-sm font-medium">Subtitle style</div>
      <div className="space-y-4 overflow-y-auto scrollbar-thin p-3">
        <div className="grid grid-cols-2 gap-2">
          {STYLES.map((s) => (
            <button key={s.id} onClick={() => onChange(s.id)}
              className={`rounded-lg border p-3 text-left transition-colors ${value === s.id ? "border-primary/60 bg-primary/10" : "border-border bg-elevated/40 hover:border-primary/30"}`}>
              <div className="text-xs font-medium text-foreground">{s.label}</div>
              <div className={`mt-2 truncate text-[11px] ${value === s.id ? "text-primary" : "text-muted-foreground"}`}>{s.preview}</div>
            </button>
          ))}
        </div>
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Premium presets</div>
          <div className="grid grid-cols-2 gap-2">
            {MORE.map((s) => (
              <div key={s.id} className="cursor-not-allowed rounded-lg border border-border bg-elevated/30 p-3 opacity-60">
                <div className="flex items-center justify-between text-xs"><span>{s.label}</span><span className="text-[9px] uppercase text-warning">Pro</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
