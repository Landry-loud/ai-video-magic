import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { Shield, Users, Activity, LifeBuoy, BarChart3 } from "lucide-react";
import { checkIsAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/_admin")({
  head: () => ({ meta: [{ title: "Admin — AI Edit Studio" }] }),
  beforeLoad: async () => {
    const { isAdmin } = await checkIsAdmin();
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: AdminLayout,
  errorComponent: ({ error }) => <div className="p-6 text-sm text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-6">Not found.</div>,
});

const tabs = [
  { to: "/admin", icon: BarChart3, label: "Overview", exact: true },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/jobs", icon: Activity, label: "Jobs" },
  { to: "/admin/support", icon: LifeBuoy, label: "Support" },
] as const;

function AdminLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="-m-6 flex min-h-[calc(100vh-3.5rem)] flex-col">
      <header className="flex items-center gap-4 border-b border-border-subtle bg-surface/60 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 ring-1 ring-primary/30">
            <Shield className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-display text-sm font-semibold">Admin</span>
        </div>
        <nav className="ml-4 flex items-center gap-1">
          {tabs.map((t) => {
            const active = t.exact ? path === t.to : path.startsWith(t.to);
            return (
              <Link key={t.to} to={t.to} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors ${active ? "bg-elevated text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="flex-1 p-6"><Outlet /></div>
    </div>
  );
}
