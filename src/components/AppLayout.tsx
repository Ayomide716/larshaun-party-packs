import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useSettings } from "@/context/SettingsContext";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10 px-4 gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground flex-shrink-0" />
            <div className="h-4 w-px bg-border flex-shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{settings.businessName}</span>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
