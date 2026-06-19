import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const plans = [
  { id: "free", name: "Free", price: "$0", features: ["100 credits/mo", "1080p export", "Watermark"] },
  { id: "pro", name: "Pro", price: "$19", features: ["2,000 credits/mo", "No watermark", "All subtitle styles", "Beat-sync transitions"] },
  { id: "agency", name: "Agency", price: "$79", features: ["10,000 credits/mo", "4K & 60 FPS", "Team seats", "Priority support"] },
];

export const Route = createFileRoute("/_authenticated/dashboard/billing")({
  head: () => ({ meta: [{ title: "Billing — AI Edit Studio" }] }),
  component: BillingPage,
});

function BillingPage() {
  const { data: credits } = useQuery({
    queryKey: ["credits-billing"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("credits").select("balance, plan").eq("user_id", u.user.id).maybeSingle();
      return data;
    },
  });

  const current = credits?.plan ?? "free";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">You're on the <span className="capitalize text-foreground">{current}</span> plan · {credits?.balance ?? 0} credits left.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = p.id === current;
          return (
            <div
              key={p.id}
              className={`relative rounded-2xl border p-6 shadow-card ${
                isCurrent ? "border-primary/60 bg-surface shadow-glow" : "border-border bg-surface"
              }`}
            >
              {isCurrent && <div className="absolute -top-2 right-4 rounded-full bg-primary-gradient px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary-foreground">Current</div>}
              <h3 className="font-display text-lg font-semibold">{p.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display text-3xl font-semibold">{p.price}</span>
                <span className="text-xs text-muted-foreground">/ mo</span>
              </div>
              <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
                {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-primary" /> {f}</li>)}
              </ul>
              <Button disabled className="mt-6 w-full" variant={isCurrent ? "outline" : "default"}>
                {isCurrent ? "Current plan" : "Coming soon"}
              </Button>
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs text-muted-foreground">Payments roll out in the next release.</p>
    </div>
  );
}
