// Paywall gate component. Renders children only when the user's plan
// satisfies `requires`. Otherwise renders a compact upsell card or, when
// `mode="block"`, a full-page lock.
import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { getPlan, type PlanId } from "@/lib/plans";

const ORDER: PlanId[] = ["free", "pro", "agency"];

function planRank(p?: string | null) {
  return ORDER.indexOf((p as PlanId) ?? "free");
}

export function useCurrentPlan() {
  return useQuery({
    queryKey: ["current-plan"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return "free" as PlanId;
      const { data } = await supabase.from("credits").select("plan").eq("user_id", u.user.id).maybeSingle();
      return (data?.plan ?? "free") as PlanId;
    },
  });
}

export function RequirePlan({
  requires,
  children,
  feature,
  mode = "card",
}: {
  requires: PlanId;
  children: React.ReactNode;
  feature: string;
  mode?: "card" | "inline";
}) {
  const { data: plan } = useCurrentPlan();
  if (planRank(plan) >= planRank(requires)) return <>{children}</>;

  const needed = getPlan(requires);
  if (mode === "inline") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-elevated/40 px-3 py-2 text-xs">
        <Lock className="h-3.5 w-3.5 text-warning" />
        <span className="text-muted-foreground">{feature} is on <span className="text-foreground">{needed.name}</span>.</span>
        <Link to="/dashboard/billing" className="ml-auto text-primary hover:underline">Upgrade</Link>
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 text-center shadow-card">
      <div className="absolute inset-0 bg-primary-gradient opacity-[0.06]" />
      <div className="relative">
        <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/30">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <h3 className="mt-3 font-display text-base font-semibold">{feature} is a {needed.name} feature</h3>
        <p className="mt-1 text-xs text-muted-foreground">{needed.tagline} · ${needed.priceMonthly}/mo</p>
        <Button asChild className="mt-4 bg-primary-gradient text-primary-foreground shadow-glow">
          <Link to="/dashboard/billing">Upgrade to {needed.name}</Link>
        </Button>
      </div>
    </div>
  );
}
