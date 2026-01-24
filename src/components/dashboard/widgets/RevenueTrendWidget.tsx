
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

interface RevenueTrendWidgetProps {
    data: { name: string; value: number }[];
}

export function RevenueTrendWidget({ data }: RevenueTrendWidgetProps) {
    const { locale } = useI18n();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border p-6 h-full"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    {locale === "ar" ? "اتجاه الإيرادات" : "Revenue Trend"}
                </h3>
            </div>

            <div className="h-48 flex items-end justify-between gap-2">
                {data.map((month) => {
                    const maxValue = Math.max(...data.map(m => m.value));
                    const height = maxValue > 0 ? (month.value / maxValue) * 100 : 0;
                    return (
                        <div key={month.name} className="flex-1 flex flex-col items-center gap-2">
                            <div
                                className="w-full bg-primary rounded-t-lg transition-all hover:opacity-80"
                                style={{ height: `${height}%` }}
                            />
                            <span className="text-xs text-muted-foreground">{month.name}</span>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
