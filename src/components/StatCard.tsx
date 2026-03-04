import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
  description?: string;
}

export function StatCard({ title, value, change, changeType = "neutral", icon: Icon, iconColor, description }: StatCardProps) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconColor || "bg-primary/10")}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {change && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            changeType === "positive" && "bg-green-100 text-green-700",
            changeType === "negative" && "bg-red-100 text-red-700",
            changeType === "neutral" && "bg-muted text-muted-foreground"
          )}>
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold font-display text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{title}</p>
      {description && <p className="text-xs text-muted-foreground/70 mt-1">{description}</p>}
    </div>
  );
}
