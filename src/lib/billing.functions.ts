// Server functions for billing actions. The MOCK provider applies changes
// instantly server-side so the whole flow works end-to-end without Stripe.
// When real Stripe is wired, replace handler bodies with checkout-session
// creation + portal URLs; keep input/output shapes identical.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { PLANS, CREDIT_PACKS, type PlanId } from "@/lib/plans";

// ── Subscription upgrade / downgrade (mock) ────────────────────────────────

const UpgradeInput = z.object({
  plan: z.enum(["free", "pro", "agency"]),
  billing: z.enum(["monthly", "yearly"]).default("monthly"),
});

export const mockUpgradePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpgradeInput.parse(d))
  .handler(async ({ data, context }) => {
    const plan = PLANS.find((p) => p.id === data.plan);
    if (!plan) throw new Error("Unknown plan");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    const periodEnd = new Date(Date.now() + (data.billing === "yearly" ? 365 : 30) * 24 * 3600 * 1000);

    // Upsert subscription
    await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan: data.plan as PlanId,
          status: "active",
          provider: "mock",
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
        },
        { onConflict: "user_id" },
      );

    // Update credits row: set plan + bump monthly_credits + grant the delta
    const { data: existing } = await supabaseAdmin
      .from("credits")
      .select("balance, monthly_credits")
      .eq("user_id", userId)
      .maybeSingle();

    const newMonthly = plan.monthlyCredits;
    const grant = Math.max(0, newMonthly - (existing?.monthly_credits ?? 0));

    await supabaseAdmin
      .from("credits")
      .update({ plan: data.plan as PlanId, monthly_credits: newMonthly, period_end: periodEnd.toISOString() })
      .eq("user_id", userId);

    if (grant > 0) {
      await supabaseAdmin.rpc("grant_credits", {
        _user_id: userId,
        _amount: grant,
        _reason: "plan_upgrade",
        _ref: data.plan,
      });
    }

    // Mock invoice
    const amount = data.billing === "yearly" ? plan.priceYearly : plan.priceMonthly;
    if (amount > 0) {
      await supabaseAdmin.from("invoices").insert({
        user_id: userId,
        provider: "mock",
        amount_cents: Math.round(amount * 100),
        currency: "usd",
        status: "paid",
        description: `${plan.name} plan — ${data.billing}`,
      });
    }

    return { ok: true };
  });

// ── Credit top-up (mock) ────────────────────────────────────────────────────

const TopUpInput = z.object({ packId: z.string() });

export const mockTopUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TopUpInput.parse(d))
  .handler(async ({ data, context }) => {
    const pack = CREDIT_PACKS.find((p) => p.id === data.packId);
    if (!pack) throw new Error("Unknown credit pack");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: newBalance, error } = await supabaseAdmin.rpc("grant_credits", {
      _user_id: userId,
      _amount: pack.credits,
      _reason: "topup",
      _ref: pack.id,
    });
    if (error) throw error;

    await supabaseAdmin.from("invoices").insert({
      user_id: userId,
      provider: "mock",
      amount_cents: pack.priceUsd * 100,
      currency: "usd",
      status: "paid",
      description: `${pack.credits.toLocaleString()} credit top-up`,
    });

    return { balance: newBalance as number | null };
  });

// ── Cancel (mock) ──────────────────────────────────────────────────────────

export const mockCancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("subscriptions")
      .update({ cancel_at_period_end: true, status: "active" })
      .eq("user_id", context.userId);
    return { ok: true };
  });
