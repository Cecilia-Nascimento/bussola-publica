import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  accent?: "primary" | "success" | "accent" | "warning";
  className?: string;
}

const accentMap = {
  primary: "from-primary/30 to-primary/0 text-primary",
  success: "from-success/30 to-success/0 text-success",
  accent: "from-accent/30 to-accent/0 text-accent",
  warning: "from-warning/30 to-warning/0 text-warning",
};

export function StatCard({ label, value, icon: Icon, hint, accent = "primary", className }: StatCardProps) {
  return (
    <div className={cn("glass rounded-xl p-5 shadow-card relative overflow-hidden group transition-all hover:-translate-y-0.5", className)}>
      <div className={cn("absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br blur-2xl opacity-60", accentMap[accent])} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("rounded-lg border border-border/60 bg-background/40 p-2", accentMap[accent].split(" ").pop())}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
