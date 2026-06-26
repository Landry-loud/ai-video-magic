import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { adminOverview } from "@/lib/admin.functions";
import { Users, CreditCard, Activity, DollarSign } from "lucide-react";

export const Route = createFileRoute("/_authenticated/_admin/")({
  component: AdminOverview,
});

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Users; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 font-display text-3xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function AdminOverview() {
  const fn = useServerFn(adminOverview);
  const { data } = useQuery({ queryKey: ["admin-overview"], queryFn: () => fn() });
  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-semibold">Command center</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Users" value={String(data?.users ?? 0)} />
        <Stat icon={CreditCard} label="Paid subs" value={String(data?.paid ?? 0)} hint="Pro + Agency" />
        <Stat icon={Activity} label="Jobs running" value={String(data?.jobsRunning ?? 0)} hint={`${data?.jobsTotal ?? 0} total`} />
        <Stat icon={DollarSign} label="Revenue (last 180d)" value={`$${((data?.revenueCents ?? 0) / 100).toFixed(0)}`} />
      </div>
      <div className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-medium">Recent invoices</h2>
        <div className="mt-3 divide-y divide-border-subtle text-xs">
          {(data?.invoices ?? []).slice(0, 12).map((i, idx) => (
            <div key={idx} className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">{new Date(i.created_at).toLocaleDateString()}</span>
              <span className="font-medium tabular-nums">${((i.amount_cents ?? 0) / 100).toFixed(2)} {(i.currency ?? "usd").toUpperCase()}</span>
            </div>
          ))}
          {!data?.invoices?.length && <div className="py-6 text-center text-muted-foreground">No invoices yet.</div>}
        </div>
      </div>
    </div>
  );
}
