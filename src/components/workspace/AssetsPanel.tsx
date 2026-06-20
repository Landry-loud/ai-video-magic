// Left workspace panel: project info + uploaded assets + subtitle list editor.
import { useState } from "react";
import { Film, Captions, Scissors, Merge as MergeIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { msToTimecode } from "@/lib/format";

interface Cue { id: string; start_ms: number; end_ms: number; text: string; order_index: number }

export function AssetsPanel({
  projectId,
  video,
  cues,
  onCuesChange,
  onTranscribe,
  transcribing,
}: {
  projectId: string;
  video?: { filename?: string; duration_sec?: number | null; width?: number | null; height?: number | null };
  cues: Cue[];
  onCuesChange: () => void;
  onTranscribe: () => void;
  transcribing: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border-subtle p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Project assets</div>
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-border bg-elevated/40 p-2.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <Film className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{video?.filename ?? "No video"}</div>
            <div className="text-[10px] text-muted-foreground">
              {video?.duration_sec ? `${video.duration_sec}s` : "—"} · {video?.width ?? "?"}×{video?.height ?? "?"}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <Captions className="h-3.5 w-3.5 text-primary" /> Subtitles
          <span className="text-muted-foreground">({cues.length})</span>
        </div>
        <Button size="sm" variant="ghost" onClick={onTranscribe} disabled={transcribing} className="h-7 text-xs">
          {transcribing ? "…" : cues.length > 0 ? "Re-run" : "Generate"}
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-2">
        {cues.length === 0 ? (
          <div className="grid h-full place-items-center text-center text-[11px] text-muted-foreground">
            <div>
              <Captions className="mx-auto h-5 w-5 opacity-50" />
              <p className="mt-2">No subtitles yet.<br />AI transcription generates timed cues.</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-1">
            {cues.map((c, idx) => <CueRow key={c.id} cue={c} projectId={projectId} prev={cues[idx - 1]} next={cues[idx + 1]} onChange={onCuesChange} />)}
          </ul>
        )}
      </div>
    </div>
  );
}

function CueRow({ cue, projectId, prev, next, onChange }: { cue: Cue; projectId: string; prev?: Cue; next?: Cue; onChange: () => void }) {
  const [text, setText] = useState(cue.text);
  const [editing, setEditing] = useState(false);

  const save = async () => {
    await supabase.from("subtitles").update({ text }).eq("id", cue.id);
    setEditing(false);
    onChange();
  };

  const split = async () => {
    const mid = Math.floor((cue.start_ms + cue.end_ms) / 2);
    const parts = text.split(" ");
    const half = Math.max(1, Math.floor(parts.length / 2));
    const a = parts.slice(0, half).join(" ");
    const b = parts.slice(half).join(" ") || "…";
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("subtitles").update({ text: a, end_ms: mid }).eq("id", cue.id);
    await supabase.from("subtitles").insert({
      project_id: projectId, user_id: u.user.id, start_ms: mid, end_ms: cue.end_ms, text: b, order_index: cue.order_index + 1,
    });
    toast.success("Cue split");
    onChange();
  };

  const merge = async () => {
    if (!next) return;
    await supabase.from("subtitles").update({ text: `${text} ${next.text}`, end_ms: next.end_ms }).eq("id", cue.id);
    await supabase.from("subtitles").delete().eq("id", next.id);
    toast.success("Merged with next");
    onChange();
  };

  const del = async () => {
    await supabase.from("subtitles").delete().eq("id", cue.id);
    onChange();
  };

  void prev;

  return (
    <li className="group rounded-md border border-transparent p-1.5 hover:border-border hover:bg-elevated/50">
      <div className="mb-0.5 flex items-center justify-between">
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{msToTimecode(cue.start_ms)} → {msToTimecode(cue.end_ms)}</span>
        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <IconBtn onClick={split} title="Split"><Scissors className="h-3 w-3" /></IconBtn>
          <IconBtn onClick={merge} title="Merge with next" disabled={!next}><MergeIcon className="h-3 w-3" /></IconBtn>
          <IconBtn onClick={del} title="Delete"><Trash2 className="h-3 w-3" /></IconBtn>
        </div>
      </div>
      {editing ? (
        <input
          autoFocus value={text} onChange={(e) => setText(e.target.value)} onBlur={save}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setText(cue.text); setEditing(false); } }}
          className="w-full rounded border border-primary/40 bg-background px-1.5 py-1 text-xs outline-none"
        />
      ) : (
        <button onClick={() => setEditing(true)} className="w-full text-left text-xs text-foreground/90">{text}</button>
      )}
    </li>
  );
}

function IconBtn({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...rest} className="grid h-5 w-5 place-items-center rounded text-muted-foreground hover:bg-elevated hover:text-foreground disabled:opacity-30">{children}</button>;
}

