// Billing service adapter. Currently uses a mock provider that simulates
// instant subscription changes and credit top-ups via signed-in RPCs.
// To plug Stripe (or any other provider) later, swap PROVIDER below for
// a real implementation that returns a hosted checkout URL.

import { supabase } from "@/integrations/supabase/client";
import type { PlanId } from "@/lib/plans";

export type BillingProvider = "mock" | "stripe";

export interface CheckoutSession {
  /** When `url` is null, the change was applied instantly (mock mode). */
  url: string | null;
}

export interface BillingAdapter {
  provider: BillingProvider;
  checkoutSubscription(plan: PlanId, billing: "monthly" | "yearly"): Promise<CheckoutSession>;
  checkoutCreditPack(packId: string): Promise<CheckoutSession>;
  openCustomerPortal(): Promise<CheckoutSession>;
  cancelSubscription(): Promise<void>;
}

// ─── Mock adapter (calls our own server functions) ─────────────────────────
import {
  mockUpgradePlan,
  mockTopUp,
  mockCancelSubscription,
} from "@/lib/billing.functions";

const mockAdapter: BillingAdapter = {
  provider: "mock",
  async checkoutSubscription(plan, billing) {
    await mockUpgradePlan({ data: { plan, billing } });
    return { url: null };
  },
  async checkoutCreditPack(packId) {
    await mockTopUp({ data: { packId } });
    return { url: null };
  },
  async openCustomerPortal() {
    // No portal in mock mode — surface a friendly message at the call site.
    return { url: null };
  },
  async cancelSubscription() {
    await mockCancelSubscription();
  },
};

// To enable Stripe later, set VITE_BILLING_PROVIDER="stripe" and implement
// stripeAdapter against /api/public/stripe/* server routes.
export const billing: BillingAdapter = mockAdapter;

// ─── Convenience reads (client-side) ───────────────────────────────────────

export async function getBillingState() {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not authenticated");

  const [credits, sub, txns, invoices] = await Promise.all([
    supabase.from("credits").select("balance, plan, monthly_credits, period_end").eq("user_id", u.user.id).maybeSingle(),
    supabase.from("subscriptions").select("plan, status, provider, current_period_end, cancel_at_period_end").eq("user_id", u.user.id).maybeSingle(),
    supabase.from("credit_transactions").select("id, delta, reason, balance_after, created_at, ref_id").eq("user_id", u.user.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("invoices").select("id, amount_cents, currency, status, description, hosted_url, created_at").eq("user_id", u.user.id).order("created_at", { ascending: false }).limit(20),
  ]);

  return {
    credits: credits.data,
    subscription: sub.data,
    transactions: txns.data ?? [],
    invoices: invoices.data ?? [],
  };
}
