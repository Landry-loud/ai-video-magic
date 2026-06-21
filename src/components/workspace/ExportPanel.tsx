// Right-side Export panel and Subtitle Properties.
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Download, Instagram, Youtube, Music, Sparkles, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ExportResolution, SubtitleStyle } from "@/services/types";
import { useCurrentPlan } from "@/components/billing/RequirePlan";
import { canUseResolution, getPlan } from "@/lib/plans";

const PRESETS = [
  { id: "tiktok", label: "TikTok", icon: Music, ratio: "9:16", fps: 30 },
  { id: "reels", label: "Reels", icon: Instagram, ratio: "9:16", fps: 30 },
  { id: "shorts", label: "Shorts", icon: Youtube, ratio: "9:16", fps: 60 },
  { id: "square", label: "Square", icon: Sparkles, ratio: "1:1", fps: 30 },
];

export function ExportPanel({
  resolution, setResolution,
  burn, setBurn,
  destination, setDestination,
  durationSec,
  onRender, renderJob,
}: {
  resolution: ExportResolution;
  setResolution: (r: ExportResolution) => void;
  burn: boolean;
  setBurn: (b: boolean) => void;
  destination: string;
  setDestination: (d: string) => void;
  durationSec: number;
  onRender: () => void;
  renderJob?: { status: string; progress: number } | null;
}) {
  const estimated = estimateSize(durationSec, resolution);
  const fps = PRESETS.find((p) => p.id === destination)?.fps ?? 30;
  const { data: plan = "free" } = useCurrentPlan();
  const planName = getPlan(plan).name;
  const allowed = (r: ExportResolution) => canUseResolution(plan, r);

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
              <button key={p.id} onClick={() => setDestination(p.id)}
                className={`flex items-center gap-1.5 rounded-lg border p-2 text-xs transition-colors ${destination === p.id ? "border-primary/60 bg-primary/10 text-foreground" : "border-border bg-elevated/40 text-muted-foreground hover:text-foreground"}`}>
                <p.icon className="h-3.5 w-3.5" /> {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Resolution</Label>
          <Select value={resolution} onValueChange={(v) => setResolution(v as ExportResolution)}>
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

        <div className="rounded-lg border border-border bg-elevated/40 p-3 text-xs">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Estimated</div>
          <Row label="Duration" value={`${Math.round(durationSec)}s`} />
          <Row label="Resolution" value={resolution} />
          <Row label="FPS" value={`${fps}`} />
          <Row label="Codec" value="H.264" />
          <Row label="File size" value={`≈ ${estimated} MB`} />
        </div>

        {renderJob && (renderJob.status === "queued" || renderJob.status === "processing") ? (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-foreground">Rendering…</span>
              <span className="font-mono text-muted-foreground">{renderJob.progress}%</span>
            </div>
            <Progress value={renderJob.progress} className="h-1.5" />
          </div>
        ) : (
          <Button onClick={onRender} className="w-full bg-primary-gradient text-primary-foreground shadow-glow">
            <Download className="mr-2 h-4 w-4" /> Render export
          </Button>
        )}

        {renderJob?.status === "completed" && (
          <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-xs text-success">
            Export ready — see Library.
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between py-0.5"><span className="text-muted-foreground">{label}</span><span className="font-mono text-foreground">{value}</span></div>;
}

function estimateSize(sec: number, res: ExportResolution) {
  const bitrateMbps = res === "720p" ? 5 : res === "1080p" ? 8 : res === "2k" ? 16 : 35;
  return ((bitrateMbps * sec) / 8).toFixed(1);
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
