// Client + server helper for spending credits via the deduct_credits RPC.
// Throws a typed error when balance is insufficient so callers can show a
// paywall / upsell instead of a generic failure.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export class InsufficientCreditsError extends Error {
  code = "INSUFFICIENT_CREDITS" as const;
  constructor(public readonly cost: number) {
    super(`Insufficient credits (need ${cost}).`);
  }
}

export async function spendCredits(
  client: SupabaseClient<Database>,
  amount: number,
  reason: string,
  ref?: string,
): Promise<number> {
  const { data, error } = await client.rpc("deduct_credits", {
    _amount: amount,
    _reason: reason,
    _ref: ref ?? null,
  });
  if (error) throw error;
  if (data === null) throw new InsufficientCreditsError(amount);
  return data as number;
}
