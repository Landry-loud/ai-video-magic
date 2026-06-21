// Plan and credit-pack catalog. Pure data — safe for client and server.
import type { Database } from "@/integrations/supabase/types";

export type PlanId = Database["public"]["Enums"]["plan_tier"];

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number; // USD
  priceYearly: number;
  monthlyCredits: number;
  badge?: string;
  highlight?: boolean;
  features: string[];
  limits: {
    maxResolution: "720p" | "1080p" | "2k" | "4k";
    maxFps: 30 | 60;
    watermark: boolean;
    premiumStyles: boolean;
    teamSeats: number;
    prioritySupport: boolean;
  };
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Try the AI editor",
    priceMonthly: 0,
    priceYearly: 0,
    monthlyCredits: 100,
    features: ["100 AI credits / mo", "1080p export", "Watermark", "Standard subtitle styles"],
    limits: { maxResolution: "1080p", maxFps: 30, watermark: true, premiumStyles: false, teamSeats: 1, prioritySupport: false },
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For serious creators",
    priceMonthly: 19,
    priceYearly: 190,
    monthlyCredits: 2000,
    badge: "Most popular",
    highlight: true,
    features: ["2,000 AI credits / mo", "No watermark", "2K export & 60 FPS", "All premium subtitle styles", "Beat-sync transitions", "Priority renders"],
    limits: { maxResolution: "2k", maxFps: 60, watermark: false, premiumStyles: true, teamSeats: 1, prioritySupport: false },
  },
  {
    id: "agency",
    name: "Agency",
    tagline: "For teams and agencies",
    priceMonthly: 79,
    priceYearly: 790,
    monthlyCredits: 10000,
    features: ["10,000 AI credits / mo", "4K export & 60 FPS", "5 team seats", "Priority support", "All Pro features", "Brand kit + presets"],
    limits: { maxResolution: "4k", maxFps: 60, watermark: false, premiumStyles: true, teamSeats: 5, prioritySupport: true },
  },
];

export interface CreditPack {
  id: string;
  credits: number;
  priceUsd: number;
  badge?: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "pack_500", credits: 500, priceUsd: 9 },
  { id: "pack_2000", credits: 2000, priceUsd: 29, badge: "Best value" },
  { id: "pack_10000", credits: 10000, priceUsd: 99 },
];

// Cost in credits for each metered operation.
export const CREDIT_COSTS = {
  ai_plan: 5,
  ai_analysis: 2,
  ai_copilot: 1,
  render_720p: 2,
  render_1080p: 4,
  render_2k: 8,
  render_4k: 16,
} as const;

export function getPlan(id: PlanId | string | null | undefined): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function canUseResolution(plan: PlanId, res: "720p" | "1080p" | "2k" | "4k"): boolean {
  const order = ["720p", "1080p", "2k", "4k"] as const;
  return order.indexOf(res) <= order.indexOf(getPlan(plan).limits.maxResolution);
}
