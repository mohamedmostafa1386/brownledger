
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface MetricWidgetProps {
    title: string;
    value: number;
    icon: LucideIcon;
    trend?: { value: number; isPositive: boolean };
    colorClass?: string;
    delay?: number;
    subtitle?: string; // Period indicator e.g., "This Month"
}

export function MetricWidget({ title, value, icon: Icon, trend, colorClass = "text-primary", delay = 0, subtitle }: MetricWidgetProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-card border rounded-xl p-6 h-full"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className={`w-6 h-6 ${colorClass}`} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 ${trend.isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                        {trend.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span className="text-sm font-medium">{Math.abs(trend.value)}%</span>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2 mb-1">
                <p className="text-muted-foreground text-sm">{title}</p>
                {subtitle && (
                    <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                        {subtitle}
                    </span>
                )}
            </div>
            <p className={`text-2xl font-bold ${colorClass === "text-rose-600" ? "text-rose-600" : ""}`}>{formatCurrency(value)}</p>
        </motion.div>
    );
}
