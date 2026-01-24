
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { formatCurrency } from "@/lib/utils";

interface Invoice {
    id: string;
    number: string;
    client: string;
    amount: number;
    status: string;
}

interface RecentInvoicesWidgetProps {
    invoices: Invoice[];
    isLoading: boolean;
}

export function RecentInvoicesWidget({ invoices, isLoading }: RecentInvoicesWidgetProps) {
    const { locale } = useI18n();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border p-6 h-full"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    {locale === "ar" ? "الفواتير الأخيرة" : "Recent Invoices"}
                </h3>
                <Link href="/invoices" className="text-sm text-primary hover:underline">
                    {locale === "ar" ? "عرض الكل" : "View All"}
                </Link>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg animate-pulse">
                            <div className="space-y-2">
                                <div className="h-4 w-20 bg-muted rounded" />
                                <div className="h-3 w-28 bg-muted rounded" />
                            </div>
                            <div className="h-4 w-16 bg-muted rounded" />
                        </div>
                    ))
                ) : invoices?.length ? (
                    invoices.slice(0, 5).map((invoice) => (
                        <Link
                            key={invoice.id}
                            href={`/invoices/${invoice.id}`}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition"
                        >
                            <div>
                                <p className="font-medium">{invoice.number}</p>
                                <p className="text-sm text-muted-foreground">{invoice.client}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${invoice.status === 'PAID'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                    : invoice.status === 'OVERDUE'
                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>
                                    {invoice.status}
                                </span>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>{locale === "ar" ? "لا توجد فواتير بعد" : "No invoices yet"}</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
