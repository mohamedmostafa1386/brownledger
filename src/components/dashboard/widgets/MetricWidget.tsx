
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
}

export function MetricWidget({ title, value, icon: Icon, trend, colorClass = "text-primary", delay = 0 }: MetricWidgetProps) {
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
            <p className="text-muted-foreground text-sm mb-1">{title}</p>
            <p className={`text-2xl font-bold ${colorClass === "text-rose-600" ? "text-rose-600" : ""}`}>{formatCurrency(value)}</p>
        </motion.div>
    );
}
