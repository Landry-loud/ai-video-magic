// Server functions for the AI Agent — one-shot structured generations
// through Lovable AI Gateway. Streaming chat lives at /api/copilot.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

// ----- Editing plan -----

const EditingPlanSchema = z.object({
  strategy: z.string().describe("Overall editing strategy in 2-3 sentences."),
  hook: z.string().describe("First 3-second hook line/idea."),
  storyPacing: z.string().describe("How to pace the story — fast, medium, slow, and where."),
  subtitleStyle: z.enum(["tiktok", "minimal", "gaming", "podcast"]),
  cameraZooms: z.array(z.string()).max(5).describe("Suggested zoom moments."),
  transitions: z.array(z.string()).max(5).describe("Recommended transition styles."),
  musicMood: z.string(),
  viralScore: z.number().min(0).max(100),
  retentionScore: z.number().min(0).max(100),
  hookQuality: z.number().min(0).max(100),
  rhythmScore: z.number().min(0).max(100),
  subtitleQuality: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),
  thumbnailIdea: z.string(),
  youtubeTitle: z.string().max(70),
  tiktokCaption: z.string().max(200),
  hashtags: z.array(z.string()).min(3).max(12),
});

export type EditingPlan = z.infer<typeof EditingPlanSchema>;

const PlanInput = z.object({
  projectId: z.string().uuid(),
  prompt: z.string().min(1).max(2000),
  videoMeta: z
    .object({
      durationSec: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      filename: z.string().optional(),
    })
    .optional(),
});

export const generateEditingPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PlanInput.parse(d))
  .handler(async ({ data, context }) => {
    // Verify project ownership
    const { data: project } = await context.supabase
      .from("projects")
      .select("id")
      .eq("id", data.projectId)
      .maybeSingle();
    if (!project) throw new Error("Project not found");

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const meta = data.videoMeta;
    const metaLine = meta
      ? `Video: ${meta.filename ?? "untitled"} · ${meta.durationSec ?? "?"}s · ${meta.width ?? "?"}x${meta.height ?? "?"}.`
      : "Video metadata unknown.";

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const { experimental_output } = await generateText({
      model,
      system:
        "You are a senior short-form video editor working on TikTok/Reels/Shorts edits. " +
        "You produce concise, opinionated editing plans. Be decisive, never wishy-washy. " +
        "Scores reflect predicted performance for a typical creator audience.",
      prompt: `${metaLine}\n\nCreator brief: ${data.prompt}\n\nProduce a complete editing plan.`,
      experimental_output: Output.object({ schema: EditingPlanSchema }),
    });

    return experimental_output;
  });

// ----- Analysis (mock-like but generated) -----

const AnalysisSchema = z.object({
  speakingPct: z.number().min(0).max(100),
  facesPct: z.number().min(0).max(100),
  highlights: z.number().int().min(0).max(20),
  silencePct: z.number().min(0).max(100),
  energy: z.number().min(0).max(100),
  emotion: z.enum(["calm", "excited", "intense", "warm", "neutral"]),
  movement: z.number().min(0).max(100),
  musicConfidence: z.number().min(0).max(100),
  notes: z.array(z.string()).max(5),
});

export type Analysis = z.infer<typeof AnalysisSchema>;

const AnalyzeInput = z.object({
  projectId: z.string().uuid(),
  prompt: z.string().optional(),
});

export const runAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AnalyzeInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");
    const { experimental_output } = await generateText({
      model,
      system:
        "You simulate a video analysis engine. Without access to the raw video, infer a plausible analysis from the creator brief, then return realistic numbers. Vary the values between calls — don't return obvious round numbers.",
      prompt: `Creator brief: ${data.prompt ?? "(none)"}.\n\nReturn an analysis snapshot.`,
      experimental_output: Output.object({ schema: AnalysisSchema }),
    });
    return experimental_output;
  });
