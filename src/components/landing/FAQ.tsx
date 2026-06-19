import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "What kinds of videos can I edit?", a: "Anything from interviews, podcasts and gameplay to gym sessions and vlogs. We accept MP4, MOV, AVI and MKV up to 500 MB." },
  { q: "Do I need editing skills?", a: "No. Describe what you want in plain English — the AI handles cuts, captions, transitions and export ratios." },
  { q: "What does the AI actually do today?", a: "Phase 1 ships AI transcription, multi-style subtitles, smart cropping presets and TikTok/Reels/Shorts export. Beat-sync, motion effects and silence removal are rolling out next." },
  { q: "Where are my videos stored?", a: "Privately, encrypted at rest. Only you can access your raw footage and exports." },
  { q: "Can I cancel anytime?", a: "Yes — no commitment. Your existing exports stay yours forever." },
];

export function FAQ() {
  return (
    <section className="border-b border-border-subtle px-6 py-28">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="font-display text-xs uppercase tracking-[0.2em] text-primary">FAQ</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Questions, answered.
          </h2>
        </div>
        <Accordion type="single" collapsible className="mt-12">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`i-${i}`} className="border-border">
              <AccordionTrigger className="text-left text-foreground hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
