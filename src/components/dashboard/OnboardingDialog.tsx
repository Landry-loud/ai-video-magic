// First-time onboarding wizard. Marks profiles.onboarded_at on completion.
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";

const USE_CASES = ["Creator (TikTok / Reels)", "Agency / freelancer", "Podcast / longform", "Brand / marketing", "Just exploring"];

export function OnboardingDialog() {
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["onboarding-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("id, display_name, onboarded_at, use_case").eq("id", u.user.id).maybeSingle();
      return data;
    },
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [useCase, setUseCase] = useState(USE_CASES[0]);

  useEffect(() => {
    if (profile && !profile.onboarded_at) {
      setOpen(true);
      setName(profile.display_name ?? "");
    }
  }, [profile]);

  const finish = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("profiles").update({ display_name: name || profile?.display_name, use_case: useCase, onboarded_at: new Date().toISOString() }).eq("id", u.user.id);
    qc.invalidateQueries({ queryKey: ["onboarding-profile"] });
    qc.invalidateQueries({ queryKey: ["profile-topbar"] });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/30"><Sparkles className="h-5 w-5 text-primary" /></div>
          <DialogTitle className="mt-3 font-display text-2xl">Welcome to AI Edit Studio</DialogTitle>
          <DialogDescription>Let's personalize your workspace in 10 seconds.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Your name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">What brings you here?</label>
            <div className="mt-2 grid gap-2">
              {USE_CASES.map((u) => (
                <button key={u} onClick={() => setUseCase(u)} className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${useCase === u ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"}`}>{u}</button>
              ))}
            </div>
          </div>
          <Button onClick={finish} className="w-full bg-primary-gradient text-primary-foreground shadow-glow">Get started</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
