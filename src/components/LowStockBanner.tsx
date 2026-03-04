import { useSettings } from "@/context/SettingsContext";
import { AlertTriangle, X, RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LowStockBanner() {
  const { lowStockAlerts, dismissAlert, requestReorder, reorderRequests, settings } = useSettings();

  if (!settings.notifications.lowStock) return null;

  const active = lowStockAlerts.filter(a => !a.dismissed);
  if (active.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {active.slice(0, 3).map(alert => {
        const ordered = reorderRequests.includes(alert.productId);
        return (
          <div
            key={alert.productId}
            className={cn(
              "bg-card border rounded-xl p-4 shadow-lg flex flex-col gap-2 animate-in slide-in-from-bottom-4",
              ordered ? "border-[hsl(var(--forest)_/_0.5)]" : "border-destructive/30"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {ordered
                  ? <CheckCircle className="w-4 h-4 text-[hsl(var(--forest))] flex-shrink-0" />
                  : <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                }
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {ordered ? "Reorder Requested" : "Low Stock Alert"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {alert.productName} · {alert.currentStock}/{alert.minStock} units
                  </p>
                </div>
              </div>
              <button onClick={() => dismissAlert(alert.productId)} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {!ordered && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs w-full border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => requestReorder(alert.productId)}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Request Reorder
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
