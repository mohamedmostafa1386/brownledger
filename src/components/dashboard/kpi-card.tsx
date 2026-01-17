import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KPICardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    trend: string;
    trendUp: boolean | null;
    isLoading?: boolean;
}

export function KPICard({
    title,
    value,
    icon: Icon,
    trend,
    trendUp,
    isLoading,
}: KPICardProps) {
    if (isLoading) {
        return (
            <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between">
                    <div className="h-10 w-10 skeleton rounded-lg" />
                    <div className="h-4 w-16 skeleton rounded" />
                </div>
                <div className="mt-4 h-6 w-24 skeleton rounded" />
                <div className="mt-1 h-4 w-16 skeleton rounded" />
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                </div>
                {trendUp !== null && (
                    <span
                        className={cn(
                            "text-xs font-medium",
                            trendUp ? "text-green-600" : "text-red-600"
                        )}
                    >
                        {trend}
                    </span>
                )}
                {trendUp === null && (
                    <span className="text-xs text-muted-foreground">{trend}</span>
                )}
            </div>
            <div className="mt-4">
                <p className="text-2xl font-semibold tracking-tight">{value}</p>
                <p className="text-sm text-muted-foreground">{title}</p>
            </div>
        </div>
    );
}
