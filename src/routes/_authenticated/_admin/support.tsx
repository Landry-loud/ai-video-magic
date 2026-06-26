import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { adminListTickets, adminReplyTicket } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/support")({ component: AdminSupport });

function AdminSupport() {
  const list = useServerFn(adminListTickets);
  const reply = useServerFn(adminReplyTicket);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-tickets"], queryFn: () => list() });
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const ticket = data?.find((t) => t.id === selected);

  const submit = async () => {
    if (!ticket || !draft.trim()) return;
    try {
      await reply({ data: { ticketId: ticket.id, reply: draft, status: "pending" } });
      toast.success("Reply sent"); setDraft(""); qc.invalidateQueries({ queryKey: ["admin-tickets"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <div className="grid h-[calc(100vh-12rem)] grid-cols-[320px_1fr] gap-4">
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="border-b border-border-subtle p-3 text-xs uppercase tracking-wider text-muted-foreground">Inbox</div>
        <div className="divide-y divide-border-subtle overflow-y-auto">
          {(data ?? []).map((t) => (
            <button key={t.id} onClick={() => setSelected(t.id)} className={`w-full px-3 py-3 text-left text-sm transition-colors ${selected === t.id ? "bg-elevated" : "hover:bg-elevated/40"}`}>
              <div className="flex items-center justify-between">
                <span className="truncate font-medium">{t.subject}</span>
                <span className="ml-2 shrink-0 rounded-full bg-elevated px-2 py-0.5 text-[10px] capitalize">{t.status}</span>
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">{t.body}</div>
            </button>
          ))}
          {!data?.length && <div className="p-6 text-center text-xs text-muted-foreground">No tickets.</div>}
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface p-5">
        {!ticket ? <div className="grid h-full place-items-center text-sm text-muted-foreground">Select a ticket.</div> : (
          <div className="flex h-full flex-col gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold">{ticket.subject}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{ticket.body}</p>
            </div>
            {ticket.admin_reply && <div className="rounded-lg border border-border bg-elevated/40 p-3 text-sm"><div className="mb-1 text-xs text-muted-foreground">Last reply</div>{ticket.admin_reply}</div>}
            <div className="mt-auto space-y-2">
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type your reply…" rows={4} />
              <div className="flex justify-end"><Button onClick={submit} disabled={!draft.trim()}>Send reply</Button></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
