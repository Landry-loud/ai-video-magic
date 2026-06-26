// Team / collaboration server functions.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string }) => d)
  .handler(async ({ data, context }) => {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 32) + "-" + Math.random().toString(36).slice(2, 6);
    const { data: team, error } = await context.supabase.from("teams")
      .insert({ name: data.name, slug, owner_id: context.userId })
      .select().single();
    if (error) throw new Error(error.message);
    await context.supabase.from("team_members").insert({ team_id: team.id, user_id: context.userId, role: "owner" });
    return team;
  });

export const inviteTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { teamId: string; email: string; role: "admin" | "editor" | "viewer" }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("team_invitations")
      .insert({ team_id: data.teamId, email: data.email, role: data.role, invited_by: context.userId })
      .select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const acceptInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: teamId, error } = await context.supabase.rpc("accept_team_invitation", { _token: data.token });
    if (error) throw new Error(error.message);
    return { teamId };
  });

export const removeMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { teamId: string; userId: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("team_members").delete().eq("team_id", data.teamId).eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { teamId: string; userId: string; role: "admin" | "editor" | "viewer" }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("team_members").update({ role: data.role }).eq("team_id", data.teamId).eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const lookupInvitation = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data: inv, error } = await client.from("team_invitations")
      .select("id, team_id, email, role, expires_at, accepted_at, teams(name, slug)")
      .eq("token", data.token).maybeSingle();
    if (error) throw new Error(error.message);
    return inv;
  });
