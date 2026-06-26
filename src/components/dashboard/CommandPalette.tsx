// ⌘K command palette — jump to projects/pages, quick actions.
import { useEffect, useState } from "react";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FolderKanban, Sparkles, CreditCard, Film, Users, Settings, Shield, LayoutDashboard } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { data: projects } = useQuery({
    queryKey: ["palette-projects"],
    enabled: open,
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id, name").order("updated_at", { ascending: false }).limit(12);
      return data ?? [];
    },
  });

  const go = (to: string) => { setOpen(false); navigate({ to: to as "/dashboard" }); };
  const goProject = (id: string) => { setOpen(false); navigate({ to: "/dashboard/projects/$projectId", params: { projectId: id } }); };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Navigate">
            <CommandItem onSelect={() => go("/dashboard")}><LayoutDashboard className="mr-2 h-4 w-4" />Overview</CommandItem>
            <CommandItem onSelect={() => go("/dashboard/projects")}><FolderKanban className="mr-2 h-4 w-4" />Projects</CommandItem>
            <CommandItem onSelect={() => go("/dashboard/templates")}><Sparkles className="mr-2 h-4 w-4" />Templates</CommandItem>
            <CommandItem onSelect={() => go("/dashboard/renders")}><Film className="mr-2 h-4 w-4" />Renders</CommandItem>
            <CommandItem onSelect={() => go("/dashboard/team")}><Users className="mr-2 h-4 w-4" />Team</CommandItem>
            <CommandItem onSelect={() => go("/dashboard/billing")}><CreditCard className="mr-2 h-4 w-4" />Billing</CommandItem>
            <CommandItem onSelect={() => go("/dashboard/settings")}><Settings className="mr-2 h-4 w-4" />Settings</CommandItem>
            <CommandItem onSelect={() => go("/admin")}><Shield className="mr-2 h-4 w-4" />Admin</CommandItem>
          </CommandGroup>
          {projects && projects.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Projects">
                {projects.map((p) => (
                  <CommandItem key={p.id} onSelect={() => goProject(p.id)}>
                    <FolderKanban className="mr-2 h-4 w-4 text-muted-foreground" />{p.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
