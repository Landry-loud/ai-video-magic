import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { CommandPalette } from "@/components/dashboard/CommandPalette";
import { OnboardingDialog } from "@/components/dashboard/OnboardingDialog";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AI Edit Studio" }] }),
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="min-w-0 flex-1 p-6 scrollbar-thin">
            <Outlet />
          </main>
        </div>
      </div>
      <CommandPalette />
      <OnboardingDialog />
    </SidebarProvider>
  );
}
