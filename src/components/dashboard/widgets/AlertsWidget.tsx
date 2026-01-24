
import { motion } from "framer-motion";
import { AlertTriangle, XCircle, Clock, TrendingDown, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { formatCurrency } from "@/lib/utils";

interface AlertsWidgetProps {
    overdueInvoices: any[];
    unpaidInvoices: any[];
    profit: number;
}

export function AlertsWidget({ overdueInvoices, unpaidInvoices, profit }: AlertsWidgetProps) {
    const { locale } = useI18n();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border p-6 h-full"
        >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                {locale === "ar" ? "التنبيهات والإجراءات" : "Alerts & Actions"}
            </h3>
            <div className="space-y-3">
                {overdueInvoices.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-800">
                        <XCircle className="w-5 h-5 text-rose-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium">
                                {overdueInvoices.length} {locale === "ar" ? "فاتورة متأخرة" : `Overdue Invoice${overdueInvoices.length > 1 ? 's' : ''}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {locale === "ar" ? "الإجمالي:" : "Total:"} {formatCurrency(overdueInvoices.reduce((sum, i) => sum + i.amount, 0))}
                            </p>
                        </div>
                        <Link href="/invoices?status=overdue" className="ml-auto text-sm text-primary hover:underline">
                            {locale === "ar" ? "عرض" : "View"}
                        </Link>
                    </div>
                )}

                {unpaidInvoices.length > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium">
                                {unpaidInvoices.length} {locale === "ar" ? "دفعة معلقة" : `Pending Payment${unpaidInvoices.length > 1 ? 's' : ''}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {locale === "ar" ? "يتطلب متابعة" : "Follow up required"}
                            </p>
                        </div>
                        <Link href="/payments" className="ml-auto text-sm text-primary hover:underline">
                            {locale === "ar" ? "تحصيل" : "Collect"}
                        </Link>
                    </div>
                )}

                {profit < 0 && (
                    <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-800">
                        <TrendingDown className="w-5 h-5 text-rose-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium">{locale === "ar" ? "ربح سلبي" : "Negative Profit"}</p>
                            <p className="text-xs text-muted-foreground">{locale === "ar" ? "راجع المصروفات" : "Review expenses"}</p>
                        </div>
                        <Link href="/dashboard?tab=analytics" className="ml-auto text-sm text-primary hover:underline">
                            {locale === "ar" ? "تحليل" : "Analyze"}
                        </Link>
                    </div>
                )}

                {overdueInvoices.length === 0 && unpaidInvoices.length === 0 && profit >= 0 && (
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <p className="text-sm font-medium">
                            {locale === "ar" ? "كل شيء على ما يرام! العمل يسير بسلاسة." : "All clear! Business is running smoothly."}
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
