import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Sparkles, Zap, AlertTriangle, Receipt, TrendingUp, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { billing, getBillingState } from "@/services/billing";
import { PLANS, CREDIT_PACKS, getPlan, type PlanId } from "@/lib/plans";

export const Route = createFileRoute("/_authenticated/dashboard/billing")({
  head: () => ({ meta: [{ title: "Billing — AI Edit Studio" }] }),
  component: BillingPage,
});

function BillingPage() {
  const qc = useQueryClient();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const { data, isLoading } = useQuery({ queryKey: ["billing"], queryFn: getBillingState });

  const upgrade = useMutation({
    mutationFn: async (plan: PlanId) => billing.checkoutSubscription(plan, billingCycle),
    onSuccess: (res, plan) => {
      if (res.url) window.location.assign(res.url);
      else {
        toast.success(`Upgraded to ${getPlan(plan).name}`);
        qc.invalidateQueries();
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const topUp = useMutation({
    mutationFn: async (packId: string) => billing.checkoutCreditPack(packId),
    onSuccess: (res) => {
      if (res.url) window.location.assign(res.url);
      else { toast.success("Credits added"); qc.invalidateQueries(); }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: async () => billing.cancelSubscription(),
    onSuccess: () => { toast.success("Subscription will cancel at period end"); qc.invalidateQueries(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const plan = (data?.credits?.plan ?? "free") as PlanId;
  const monthly = data?.credits?.monthly_credits ?? 100;
  const balance = data?.credits?.balance ?? 0;
  const used = Math.max(0, monthly - balance);
  const usedPct = monthly ? Math.min(100, (used / monthly) * 100) : 0;
  const periodEnd = data?.subscription?.current_period_end ?? data?.credits?.period_end ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <header>
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold">Billing & credits</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your plan, top up AI credits, and download invoices.
            </p>
          </div>
          <Badge variant="outline" className="hidden gap-1.5 text-[10px] uppercase tracking-wider md:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Stripe sandbox — mock mode
          </Badge>
        </div>
      </header>

      {/* Usage overview */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardLabel icon={<Sparkles className="h-3.5 w-3.5" />}>Current plan</CardLabel>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="font-display text-2xl font-semibold capitalize">{getPlan(plan).name}</div>
            {data?.subscription?.cancel_at_period_end && (
              <Badge variant="outline" className="text-warning border-warning/40">Cancels {fmtDate(periodEnd)}</Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {periodEnd ? <>Renews <span className="text-foreground">{fmtDate(periodEnd)}</span></> : "—"}
          </p>
        </Card>
        <Card>
          <CardLabel icon={<Zap className="h-3.5 w-3.5" />}>AI credits</CardLabel>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold tabular-nums">{balance.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">/ {monthly.toLocaleString()} this cycle</span>
          </div>
          <Progress value={100 - usedPct} className="mt-3 h-1.5" />
          <p className="mt-2 text-xs text-muted-foreground">{used.toLocaleString()} used · {(100 - usedPct).toFixed(0)}% remaining</p>
        </Card>
        <Card>
          <CardLabel icon={<TrendingUp className="h-3.5 w-3.5" />}>This month</CardLabel>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold tabular-nums">{used.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">credits spent</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {(data?.transactions ?? []).filter((t) => t.delta < 0).length} AI actions
          </p>
        </Card>
      </section>

      {balance < 20 && (
        <div className="flex items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
          <span className="text-foreground">You're low on credits.</span>
          <span className="text-muted-foreground">Top up or upgrade to keep generating.</span>
        </div>
      )}

      {/* Plans */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Plans</h2>
          <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")}>
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly · 2 mo free</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => {
            const isCurrent = p.id === plan;
            const price = billingCycle === "yearly" ? p.priceYearly / 12 : p.priceMonthly;
            return (
              <div key={p.id}
                className={`relative flex flex-col rounded-2xl border p-6 transition-shadow ${
                  p.highlight ? "border-primary/60 bg-surface shadow-glow" : "border-border bg-surface shadow-card"
                }`}>
                {p.badge && (
                  <div className="absolute -top-2 left-6 rounded-full bg-primary-gradient px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary-foreground">
                    {p.badge}
                  </div>
                )}
                <div>
                  <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.tagline}</p>
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-semibold">${price}</span>
                  <span className="text-xs text-muted-foreground">/ mo</span>
                  {billingCycle === "yearly" && p.priceMonthly > 0 && (
                    <span className="ml-2 text-[10px] text-success">save ${(p.priceMonthly * 12 - p.priceYearly).toFixed(0)}/yr</span>
                  )}
                </div>
                <ul className="mt-5 flex-1 space-y-2 text-sm text-muted-foreground">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => upgrade.mutate(p.id)}
                  disabled={isCurrent || upgrade.isPending}
                  variant={isCurrent ? "outline" : p.highlight ? "default" : "secondary"}
                  className={`mt-6 w-full ${p.highlight && !isCurrent ? "bg-primary-gradient text-primary-foreground shadow-glow" : ""}`}
                >
                  {upgrade.isPending && upgrade.variables === p.id ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</>
                  ) : isCurrent ? "Current plan" : p.priceMonthly === 0 ? "Downgrade" : `Upgrade to ${p.name}`}
                </Button>
              </div>
            );
          })}
        </div>
        {plan !== "free" && !data?.subscription?.cancel_at_period_end && (
          <div className="mt-4 text-right">
            <button onClick={() => cancel.mutate()} disabled={cancel.isPending} className="text-xs text-muted-foreground hover:text-destructive">
              Cancel subscription
            </button>
          </div>
        )}
      </section>

      {/* Credit packs */}
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold">Credit top-up</h2>
        <p className="mb-4 text-sm text-muted-foreground">One-time purchases. Credits never expire.</p>
        <div className="grid gap-4 md:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <div key={pack.id} className="relative rounded-xl border border-border bg-surface p-5 shadow-card">
              {pack.badge && (
                <Badge className="absolute -top-2 right-4 bg-success/15 text-success border-success/30">{pack.badge}</Badge>
              )}
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <div className="font-display text-xl font-semibold">{pack.credits.toLocaleString()}</div>
                <span className="text-xs text-muted-foreground">credits</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-display text-2xl font-semibold">${pack.priceUsd}</span>
                <span className="text-xs text-muted-foreground">${(pack.priceUsd / pack.credits * 1000).toFixed(2)} / 1k</span>
              </div>
              <Button
                variant="outline"
                onClick={() => topUp.mutate(pack.id)}
                disabled={topUp.isPending}
                className="mt-4 w-full"
              >
                {topUp.isPending && topUp.variables === pack.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Buy {pack.credits.toLocaleString()} credits
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Activity */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold">Recent usage</h2>
          <div className="rounded-xl border border-border bg-surface">
            {isLoading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
            ) : (data?.transactions ?? []).length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No activity yet.</div>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {(data?.transactions ?? []).slice(0, 12).map((t) => (
                  <li key={t.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <div className="truncate text-foreground">{labelForReason(t.reason)}</div>
                      <div className="text-[11px] text-muted-foreground">{fmtDate(t.created_at)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono text-sm tabular-nums ${t.delta < 0 ? "text-destructive" : "text-success"}`}>
                        {t.delta > 0 ? "+" : ""}{t.delta}
                      </div>
                      <div className="text-[10px] text-muted-foreground">bal {t.balance_after}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div>
          <h2 className="mb-3 font-display text-lg font-semibold flex items-center gap-2"><Receipt className="h-4 w-4 text-muted-foreground" /> Invoices</h2>
          <div className="rounded-xl border border-border bg-surface">
            {(data?.invoices ?? []).length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No invoices yet.</div>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {(data?.invoices ?? []).map((i) => (
                  <li key={i.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <div className="truncate text-foreground">{i.description ?? "Charge"}</div>
                      <div className="text-[11px] text-muted-foreground">{fmtDate(i.created_at)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm tabular-nums">${(i.amount_cents / 100).toFixed(2)}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{i.status}</Badge>
                      {i.hosted_url && (
                        <a href={i.hosted_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground"><ExternalLink className="h-3.5 w-3.5" /></a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Need help with billing? <Link to="/dashboard/settings" className="underline">Contact support</Link>
      </p>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-surface p-5 shadow-card">{children}</div>;
}
function CardLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{icon}{children}</div>;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function labelForReason(r: string) {
  switch (r) {
    case "ai_plan": return "AI editing plan";
    case "ai_analysis": return "AI analysis";
    case "ai_copilot": return "AI Copilot turn";
    case "render_export": return "Render export";
    case "monthly_grant": return "Monthly credit grant";
    case "topup": return "Credit top-up";
    case "plan_upgrade": return "Plan upgrade bonus";
    default: return r;
  }
}
