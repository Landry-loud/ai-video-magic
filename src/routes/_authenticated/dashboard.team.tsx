import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { createTeam, inviteTeamMember, removeMember } from "@/lib/team.functions";
import { Users, UserPlus, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/team")({
  head: () => ({ meta: [{ title: "Team — AI Edit Studio" }] }),
  component: TeamPage,
});

function TeamPage() {
  const create = useServerFn(createTeam);
  const invite = useServerFn(inviteTeamMember);
  const remove = useServerFn(removeMember);
  const qc = useQueryClient();

  const { data: teams } = useQuery({
    queryKey: ["my-teams"],
    queryFn: async () => {
      const { data } = await supabase.from("teams").select("id, name, slug, owner_id, plan, seats_limit, team_members(user_id, role, profiles(display_name, avatar_url))").order("created_at");
      return data ?? [];
    },
  });

  const { data: invites } = useQuery({
    queryKey: ["my-invites"],
    queryFn: async () => {
      const { data } = await supabase.from("team_invitations").select("id, team_id, email, role, token, expires_at, accepted_at").is("accepted_at", null);
      return data ?? [];
    },
  });

  const [newTeam, setNewTeam] = useState("");
  const onCreate = async () => {
    if (!newTeam.trim()) return;
    try { await create({ data: { name: newTeam } }); toast.success("Team created"); setNewTeam(""); qc.invalidateQueries({ queryKey: ["my-teams"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [activeTeam, setActiveTeam] = useState<string | null>(null);
  const onInvite = async () => {
    if (!activeTeam || !email) return;
    try { await invite({ data: { teamId: activeTeam, email, role } }); toast.success("Invitation sent"); setEmail(""); qc.invalidateQueries({ queryKey: ["my-invites"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const onRemove = async (teamId: string, userId: string) => {
    try { await remove({ data: { teamId, userId } }); toast.success("Removed"); qc.invalidateQueries({ queryKey: ["my-teams"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">Invite collaborators, manage roles, share projects.</p>
        </div>
        <div className="flex gap-2">
          <Input placeholder="New team name…" value={newTeam} onChange={(e) => setNewTeam(e.target.value)} className="h-9 w-56" />
          <Button onClick={onCreate}>Create team</Button>
        </div>
      </div>

      {(teams ?? []).map((t) => {
        const members = (t.team_members ?? []) as { user_id: string; role: string; profiles: { display_name: string | null; avatar_url: string | null } | null }[];
        return (
          <div key={t.id} className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /><h2 className="font-display text-lg font-semibold">{t.name}</h2><span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{t.plan}</span></div>
              <div className="text-xs text-muted-foreground">{members.length} / {t.seats_limit} seats</div>
            </div>
            <div className="mt-4 divide-y divide-border-subtle">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center justify-between py-2 text-sm">
                  <div><span className="font-medium">{m.profiles?.display_name ?? m.user_id.slice(0, 8)}</span><span className="ml-2 text-xs text-muted-foreground capitalize">{m.role}</span></div>
                  {m.role !== "owner" && <Button size="icon" variant="ghost" onClick={() => onRemove(t.id, m.user_id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2 border-t border-border-subtle pt-4">
              <Input placeholder="invite@email.com" value={activeTeam === t.id ? email : ""} onFocus={() => setActiveTeam(t.id)} onChange={(e) => setEmail(e.target.value)} className="h-9" />
              <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "editor" | "viewer")} className="h-9 rounded-md border border-border bg-background px-2 text-xs">
                <option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option>
              </select>
              <Button onClick={onInvite}><UserPlus className="mr-1.5 h-3.5 w-3.5" />Invite</Button>
            </div>
          </div>
        );
      })}

      {invites && invites.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="text-sm font-medium">Pending invitations</h3>
          <div className="mt-3 divide-y divide-border-subtle text-sm">
            {invites.map((i) => {
              const link = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${i.token}`;
              return (
                <div key={i.id} className="flex items-center justify-between py-2">
                  <div><span className="font-medium">{i.email}</span><span className="ml-2 text-xs text-muted-foreground capitalize">{i.role}</span></div>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(link); toast.success("Invite link copied"); }}><Copy className="mr-1.5 h-3.5 w-3.5" />Copy link</Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!teams?.length && <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">No teams yet. Create one to start collaborating.</div>}
    </div>
  );
}
