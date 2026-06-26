// Admin server functions — gated by `has_role(uid, 'admin')`.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(ctx: { supabase: ReturnType<typeof Object>; userId: string }) {
  // @ts-expect-error supabase is the runtime client
  const { data, error } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ count: users }, { count: paid }, { count: jobsTotal }, { count: jobsRunning }, { data: invoices }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("subscriptions").select("id", { count: "exact", head: true }).neq("plan", "free"),
      supabaseAdmin.from("processing_jobs").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("processing_jobs").select("id", { count: "exact", head: true }).in("status", ["queued", "processing", "preparing", "retrying", "uploading"]),
      supabaseAdmin.from("invoices").select("amount_cents, currency, created_at").order("created_at", { ascending: false }).limit(180),
    ]);
    const revenueCents = (invoices ?? []).reduce((s, i) => s + (i.amount_cents ?? 0), 0);
    return { users: users ?? 0, paid: paid ?? 0, jobsTotal: jobsTotal ?? 0, jobsRunning: jobsRunning ?? 0, revenueCents, invoices: invoices ?? [] };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { q?: string; limit?: number } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const limit = Math.min(data.limit ?? 50, 200);
    let q = supabaseAdmin
      .from("profiles")
      .select("id, display_name, avatar_url, created_at, credits(balance, plan), subscriptions(plan, status)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (data.q) q = q.ilike("display_name", `%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminGrantCredits = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; amount: number; reason?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: bal, error } = await supabaseAdmin.rpc("grant_credits", {
      _user_id: data.userId,
      _amount: data.amount,
      _reason: data.reason ?? "admin_grant",
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId,
      action: "grant_credits",
      target: data.userId,
      payload: { amount: data.amount, reason: data.reason },
    });
    return { balance: bal };
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: "user" | "admin" }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("admin_audit_log").insert({
      actor_id: context.userId, action: "set_role", target: data.userId, payload: { role: data.role },
    });
    return { ok: true };
  });

export const adminListJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string; limit?: number } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("processing_jobs").select("*").order("created_at", { ascending: false }).limit(Math.min(data.limit ?? 100, 500));
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminListTickets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("support_tickets").select("*, profiles!support_tickets_user_id_fkey(display_name)").order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminReplyTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ticketId: string; reply: string; status?: "open" | "pending" | "closed" }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("support_tickets").update({
      admin_reply: data.reply, replied_at: new Date().toISOString(), status: data.status ?? "pending",
    }).eq("id", data.ticketId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { isAdmin: Boolean(data) };
  });
