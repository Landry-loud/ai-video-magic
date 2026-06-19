import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    sub: "Forever",
    features: ["100 AI credits / mo", "Up to 1080p export", "TikTok / Reels / Shorts", "Watermark on exports"],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    sub: "per month",
    features: ["2,000 AI credits / mo", "No watermark", "All subtitle styles", "Beat-sync transitions", "Priority rendering"],
    cta: "Start Pro trial",
    highlight: true,
  },
  {
    name: "Agency",
    price: "$79",
    sub: "per month",
    features: ["10,000 AI credits / mo", "4K export & 60 FPS", "Team seats (up to 5)", "Brand kits", "Dedicated support"],
    cta: "Choose Agency",
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-border-subtle px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-xs uppercase tracking-[0.2em] text-primary">Pricing</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Simple, creator-friendly pricing.
          </h2>
          <p className="mt-4 text-muted-foreground">Start free. Upgrade when you scale.</p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                p.highlight
                  ? "border-primary/40 bg-surface shadow-glow"
                  : "border-border bg-surface shadow-card"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-7 rounded-full bg-primary-gradient px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-primary-foreground">
                  Most popular
                </div>
              )}
              <h3 className="font-display text-lg font-semibold text-foreground">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold text-foreground">{p.price}</span>
                <span className="text-sm text-muted-foreground">/ {p.sub}</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-foreground">
                    <Check className="mt-0.5 h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/auth"
                className={`mt-7 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  p.highlight
                    ? "bg-primary-gradient text-primary-foreground hover:opacity-95"
                    : "border border-border bg-elevated text-foreground hover:bg-accent"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
