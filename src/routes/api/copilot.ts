// AI Copilot — streaming chat about the current project. Charges 1 credit
// per assistant turn via the deduct_credits RPC.
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { CREDIT_COSTS } from "@/lib/plans";

type Body = { messages?: unknown; projectContext?: string };

export const Route = createFileRoute("/api/copilot")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, projectContext } = (await request.json()) as Body;
        if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });

        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
        const token = auth.slice(7);

        const SUPABASE_URL = process.env.SUPABASE_URL!;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });

        // Verify identity + charge before streaming.
        const { data: claims, error: claimErr } = await supabase.auth.getClaims(token);
        if (claimErr || !claims?.claims?.sub) return new Response("Unauthorized", { status: 401 });

        const { data: newBalance, error: rpcErr } = await supabase.rpc("deduct_credits", {
          _amount: CREDIT_COSTS.ai_copilot,
          _reason: "ai_copilot",
        });
        if (rpcErr) return new Response(rpcErr.message, { status: 500 });
        if (newBalance === null) {
          return new Response(
            JSON.stringify({ error: "Not enough credits — top up or upgrade your plan." }),
            { status: 402, headers: { "Content-Type": "application/json" } },
          );
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const system =
          "You are AI Edit Copilot, an always-on assistant inside AI Edit Studio. " +
          "You give crisp, decisive advice about editing the user's current short-form video project " +
          "(TikTok / Reels / Shorts). Suggest cuts, zooms, subtitle sizes, hook rewrites, music moods, " +
          "title variants. Keep answers under 120 words unless asked otherwise. Use markdown lists when helpful. " +
          (projectContext ? `\n\nCurrent project context:\n${projectContext}` : "");

        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });
        return result.toUIMessageStreamResponse({ originalMessages: messages as UIMessage[] });
      },
    },
  },
});
