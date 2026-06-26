// Templates + project shares server functions.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const publishTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; title: string; summary?: string; tags?: string[]; category?: string; heroUrl?: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("templates").insert({
      project_id: data.projectId,
      author_id: context.userId,
      title: data.title,
      summary: data.summary,
      tags: data.tags ?? [],
      category: data.category,
      hero_url: data.heroUrl,
    }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const remixTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { templateId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: projectId, error } = await context.supabase.rpc("remix_template", { _template_id: data.templateId });
    if (error) throw new Error(error.message);
    return { projectId };
  });

export const createShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { projectId: string; ogTitle?: string; ogDescription?: string; allowRemix?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("project_shares").insert({
      project_id: data.projectId,
      created_by: context.userId,
      og_title: data.ogTitle,
      og_description: data.ogDescription,
      allow_remix: data.allowRemix ?? true,
    }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getPublicShare = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data: share } = await client.from("project_shares")
      .select("id, project_id, slug, og_title, og_description, og_image, allow_remix, projects(id, name, prompt, subtitle_style, videos(storage_path, duration_sec, width, height))")
      .eq("slug", data.slug).maybeSingle();
    if (!share) return null;
    void client.from("project_shares").update({ view_count: ((share as { view_count?: number }).view_count ?? 0) + 1 }).eq("id", share.id);
    return share;
  });
