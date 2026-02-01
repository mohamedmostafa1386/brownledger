
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { formatCurrency } from "@/lib/utils";

interface ReceivablesWidgetProps {
    pending: number;
    collectionRate: number | string;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
}

export function ReceivablesWidget({ pending, collectionRate, paidCount, pendingCount, overdueCount }: ReceivablesWidgetProps) {
    const { t, locale } = useI18n();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border p-6 h-full"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    {t("widgets.receivables.title")}
                </h3>
                <Link href="/receivables" className="text-sm text-primary hover:underline">
                    {t("widgets.receivables.viewAll")}
                </Link>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t("widgets.receivables.totalPending")}</span>
                    <span className="text-2xl font-bold">{formatCurrency(pending)}</span>
                </div>

                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary"
                        style={{ width: `${collectionRate}%` }}
                    />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">{t("widgets.receivables.paid")}</p>
                        <p className="font-bold text-emerald-600">{paidCount}</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">{t("widgets.receivables.pending")}</p>
                        <p className="font-bold text-amber-600">{pendingCount}</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">{t("widgets.receivables.overdue")}</p>
                        <p className="font-bold text-rose-600">{overdueCount}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
