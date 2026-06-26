import { useEffect } from "react";
import { Bell } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDistanceToNow } from "date-fns";

type Notification = { id: string; kind: string; title: string; body: string | null; read_at: string | null; created_at: string };

export function NotificationsBell() {
  const qc = useQueryClient();
  const { data: notifs } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20);
      return (data ?? []) as Notification[];
    },
  });

  useEffect(() => {
    const channel = supabase.channel("notifications-self")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [qc]);

  const unread = (notifs ?? []).filter((n) => !n.read_at).length;

  const markAll = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null).eq("user_id", u.user.id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface text-muted-foreground hover:text-foreground" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">{unread > 9 ? "9+" : unread}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
          <div className="text-sm font-medium">Notifications</div>
          {unread > 0 && <button onClick={markAll} className="text-xs text-primary hover:underline">Mark all read</button>}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {(notifs ?? []).map((n) => (
            <div key={n.id} className={`border-b border-border-subtle px-3 py-3 text-sm ${!n.read_at ? "bg-primary/[0.03]" : ""}`}>
              <div className="font-medium">{n.title}</div>
              {n.body && <div className="mt-0.5 text-xs text-muted-foreground">{n.body}</div>}
              <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</div>
            </div>
          ))}
          {!notifs?.length && <div className="p-6 text-center text-xs text-muted-foreground">You're all caught up.</div>}
        </div>
      </PopoverContent>
    </Popover>
  );
}
