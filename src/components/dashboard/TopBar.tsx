import { useQuery } from "@tanstack/react-query";
import { Bell, Search, Sparkles } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function TopBar() {
  const { data: credits } = useQuery({
    queryKey: ["credits"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;
      const { data } = await supabase.from("credits").select("balance, plan").eq("user_id", user.user.id).maybeSingle();
      return data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-topbar"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;
      const { data } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", user.user.id).maybeSingle();
      return { ...data, email: user.user.email };
    },
  });

  const initials = (profile?.display_name || profile?.email || "?").slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border-subtle bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      <div className="relative hidden flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search projects…"
          className="h-9 w-full rounded-lg border border-border bg-surface pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/20"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-foreground sm:flex">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="font-medium">{credits?.balance ?? 0}</span>
          <span className="text-muted-foreground">credits</span>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <button className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground">
              <Bell className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <div className="text-sm font-medium">Notifications</div>
            <p className="mt-1 text-xs text-muted-foreground">You're all caught up.</p>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <button className="rounded-full ring-1 ring-border hover:ring-primary/50">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-elevated text-xs text-foreground">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56">
            <div className="text-sm font-medium">{profile?.display_name || "Creator"}</div>
            <div className="text-xs text-muted-foreground">{profile?.email}</div>
            <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              Plan · <span className="text-foreground capitalize">{credits?.plan || "free"}</span>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
