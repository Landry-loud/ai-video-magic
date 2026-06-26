// Social adapter layer — templates & shares.
// Future provider swap (e.g. CDN-backed gallery) plugs in here without UI refactors.
import { supabase } from "@/integrations/supabase/client";

export interface TemplateRow {
  id: string;
  title: string;
  summary: string | null;
  hero_url: string | null;
  tags: string[];
  category: string | null;
  remix_count: number;
  like_count: number;
  is_featured: boolean;
  author_id: string;
}

export interface SocialAdapter {
  listTemplates(opts?: { category?: string | null; q?: string }): Promise<TemplateRow[]>;
  listShares(projectId: string): Promise<{ id: string; slug: string; view_count: number; created_at: string }[]>;
}

const supabaseSocialAdapter: SocialAdapter = {
  async listTemplates({ category, q } = {}) {
    let req = supabase.from("templates").select("id,title,summary,hero_url,tags,category,remix_count,like_count,is_featured,author_id").eq("is_published", true).order("is_featured", { ascending: false }).order("remix_count", { ascending: false }).limit(60);
    if (category) req = req.eq("category", category);
    if (q) req = req.ilike("title", `%${q}%`);
    const { data, error } = await req;
    if (error) throw error;
    return data ?? [];
  },
  async listShares(projectId) {
    const { data, error } = await supabase.from("project_shares").select("id, slug, view_count, created_at").eq("project_id", projectId).order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};

export const socialService: SocialAdapter = supabaseSocialAdapter;
