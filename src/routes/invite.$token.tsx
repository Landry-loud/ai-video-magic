import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { lookupInvitation, acceptInvitation } from "@/lib/team.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({ meta: [{ title: "Join team — AI Edit Studio" }] }),
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [inv, setInv] = useState<Awaited<ReturnType<typeof lookupInvitation>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    lookupInvitation({ data: { token } }).then(setInv).catch(() => setInv(null));
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
  }, [token]);

  const accept = async () => {
    setBusy(true);
    try {
      if (!signedIn) { navigate({ to: "/auth", search: { redirect: `/invite/${token}` } as never }); return; }
      await acceptInvitation({ data: { token } });
      toast.success("Joined team");
      navigate({ to: "/dashboard/team" });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-card">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 ring-1 ring-primary/30"><Users className="h-5 w-5 text-primary" /></div>
        <h1 className="mt-4 font-display text-2xl font-semibold">You're invited</h1>
        {!inv && <p className="mt-2 text-sm text-muted-foreground">Looking up invitation…</p>}
        {inv && (
          <>
            <p className="mt-2 text-sm text-muted-foreground">Join <span className="text-foreground font-medium">{(inv as unknown as { teams?: { name?: string } }).teams?.name ?? "team"}</span> as <span className="text-foreground capitalize">{inv.role}</span>.</p>
            <Button onClick={accept} disabled={busy} className="mt-6 w-full bg-primary-gradient text-primary-foreground shadow-glow">{signedIn ? "Accept invitation" : "Sign in to accept"}</Button>
          </>
        )}
      </div>
    </div>
  );
}
