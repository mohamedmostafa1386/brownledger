
import { motion } from "framer-motion";
import { FileText, ShoppingCart, Receipt, Users } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";

export function QuickActionsWidget() {
    const { locale } = useI18n();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border p-6 h-full"
        >
            <h3 className="font-semibold mb-4">{locale === "ar" ? "إجراءات سريعة" : "Quick Actions"}</h3>
            <div className="grid grid-cols-2 gap-3">
                <Link
                    href="/invoices/new"
                    className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition group"
                >
                    <div className="p-2 bg-primary rounded-lg text-primary-foreground">
                        <FileText className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">{locale === "ar" ? "فاتورة جديدة" : "New Invoice"}</p>
                        <p className="text-xs text-muted-foreground">{locale === "ar" ? "إنشاء فاتورة" : "Create invoice"}</p>
                    </div>
                </Link>
                <Link
                    href="/pos"
                    className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition group"
                >
                    <div className="p-2 bg-primary rounded-lg text-primary-foreground">
                        <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">{locale === "ar" ? "بيع نقطة بيع" : "POS Sale"}</p>
                        <p className="text-xs text-muted-foreground">{locale === "ar" ? "بيع سريع" : "Quick sale"}</p>
                    </div>
                </Link>
                <Link
                    href="/expenses/new"
                    className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition group"
                >
                    <div className="p-2 bg-primary rounded-lg text-primary-foreground">
                        <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">{locale === "ar" ? "إضافة مصروف" : "Add Expense"}</p>
                        <p className="text-xs text-muted-foreground">{locale === "ar" ? "تسجيل مصروف" : "Record expense"}</p>
                    </div>
                </Link>
                <Link
                    href="/clients/new"
                    className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg hover:bg-muted transition group"
                >
                    <div className="p-2 bg-primary rounded-lg text-primary-foreground">
                        <Users className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-medium">{locale === "ar" ? "إضافة عميل" : "Add Client"}</p>
                        <p className="text-xs text-muted-foreground">{locale === "ar" ? "عميل جديد" : "New customer"}</p>
                    </div>
                </Link>
            </div>
        </motion.div>
    );
}
