import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Share2, Copy, Link as LinkIcon } from "lucide-react";
import { createShare, publishTemplate } from "@/lib/templates.functions";
import { socialService } from "@/services/social";
import { toast } from "sonner";

export function ShareDialog({ projectId, projectName }: { projectId: string; projectName: string }) {
  const qc = useQueryClient();
  const createShareFn = useServerFn(createShare);
  const publishFn = useServerFn(publishTemplate);
  const [open, setOpen] = useState(false);
  const [ogTitle, setOgTitle] = useState(projectName);
  const [ogDesc, setOgDesc] = useState("");
  const [allowRemix, setAllowRemix] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tplTitle, setTplTitle] = useState(projectName);
  const [tplSummary, setTplSummary] = useState("");

  const { data: shares } = useQuery({
    queryKey: ["project-shares", projectId],
    enabled: open,
    queryFn: () => socialService.listShares(projectId),
  });

  const onCreateShare = async () => {
    setBusy(true);
    try {
      await createShareFn({ data: { projectId, ogTitle, ogDescription: ogDesc, allowRemix } });
      toast.success("Share link created"); qc.invalidateQueries({ queryKey: ["project-shares", projectId] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  };

  const onPublish = async () => {
    setBusy(true);
    try { await publishFn({ data: { projectId, title: tplTitle, summary: tplSummary } }); toast.success("Published as template"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  };

  const copy = (slug: string) => { navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`); toast.success("Copied"); };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-7 text-xs"><Share2 className="mr-1.5 h-3.5 w-3.5" />Share</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Share project</DialogTitle></DialogHeader>
        <div className="space-y-5">
          <section className="space-y-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Shareable link</div>
            <Input value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} placeholder="Title shown when shared" />
            <Textarea value={ogDesc} onChange={(e) => setOgDesc(e.target.value)} placeholder="Short description" rows={2} />
            <div className="flex items-center justify-between text-sm">
              <span>Allow remix</span>
              <Switch checked={allowRemix} onCheckedChange={setAllowRemix} />
            </div>
            <Button onClick={onCreateShare} disabled={busy} className="w-full"><LinkIcon className="mr-1.5 h-3.5 w-3.5" />Create link</Button>
            {shares && shares.length > 0 && (
              <div className="space-y-1.5">
                {shares.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-md border border-border bg-elevated/40 px-2.5 py-1.5 text-xs">
                    <span className="truncate font-mono">/p/{s.slug}</span>
                    <div className="flex items-center gap-3"><span className="text-muted-foreground">{s.view_count} views</span><button onClick={() => copy(s.slug)}><Copy className="h-3 w-3" /></button></div>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="space-y-3 border-t border-border-subtle pt-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Publish as template</div>
            <Input value={tplTitle} onChange={(e) => setTplTitle(e.target.value)} placeholder="Template title" />
            <Textarea value={tplSummary} onChange={(e) => setTplSummary(e.target.value)} placeholder="What's the vibe? (1-2 sentences)" rows={2} />
            <Button onClick={onPublish} variant="outline" disabled={busy} className="w-full">Publish to gallery</Button>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
