// AI Copilot — streaming chat about the current project.
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Body = { messages?: unknown; projectContext?: string };

export const Route = createFileRoute("/api/copilot")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages, projectContext } = (await request.json()) as Body;
        if (!Array.isArray(messages)) {
          return new Response("Messages required", { status: 400 });
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
