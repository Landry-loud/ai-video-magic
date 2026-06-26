import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminListUsers, adminGrantCredits, adminSetRole } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/_admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const list = useServerFn(adminListUsers);
  const grant = useServerFn(adminGrantCredits);
  const setRole = useServerFn(adminSetRole);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["admin-users", q], queryFn: () => list({ data: { q } }) });

  const doGrant = async (userId: string) => {
    const raw = prompt("Credits to grant?");
    const amount = Number(raw);
    if (!amount || amount <= 0) return;
    try { await grant({ data: { userId, amount, reason: "admin_grant" } }); toast.success(`+${amount} credits`); qc.invalidateQueries({ queryKey: ["admin-users"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };
  const togglePromote = async (userId: string, isAdmin: boolean) => {
    try { await setRole({ data: { userId, role: isAdmin ? "user" : "admin" } }); toast.success(isAdmin ? "Demoted" : "Promoted"); qc.invalidateQueries({ queryKey: ["admin-users"] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Users</h1>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by display name…" className="h-9 w-64" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-elevated/40 text-xs text-muted-foreground">
            <tr><th className="px-4 py-2 text-left">User</th><th className="px-4 py-2 text-left">Plan</th><th className="px-4 py-2 text-right">Credits</th><th className="px-4 py-2 text-left">Joined</th><th className="px-4 py-2"></th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {(data ?? []).map((u) => {
              const credits = Array.isArray(u.credits) ? u.credits[0] : u.credits;
              return (
                <tr key={u.id} className="border-t border-border-subtle">
                  <td className="px-4 py-2"><div className="font-medium">{u.display_name ?? "—"}</div><div className="text-xs text-muted-foreground">{u.id.slice(0,8)}</div></td>
                  <td className="px-4 py-2 capitalize"><span className="rounded-full bg-elevated px-2 py-0.5 text-xs">{credits?.plan ?? "free"}</span></td>
                  <td className="px-4 py-2 text-right tabular-nums">{credits?.balance ?? 0}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => doGrant(u.id)}>+ Credits</Button>
                    <Button size="sm" variant="ghost" onClick={() => togglePromote(u.id, false)}>Promote</Button>
                  </td>
                </tr>
              );
            })}
            {!isLoading && !data?.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No users.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
