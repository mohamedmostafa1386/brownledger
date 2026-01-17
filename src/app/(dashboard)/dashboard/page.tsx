"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Clock,
    Calendar,
    FileText,
    Users,
    ShoppingCart,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    CheckCircle,
    XCircle,
    BarChart3,
    PieChart,
    Wallet,
    Receipt,
    Target,
    Percent,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AIChat } from "@/components/dashboard/ai-chat";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";

interface DashboardData {
    revenue: number;
    cogs: number;
    grossProfit: number;
    expenses: number;
    profit: number;
    pending: number;
    cash: number;
    monthlyRevenue: { name: string; value: number }[];
    recentInvoices: {
        id: string;
        number: string;
        client: string;
        amount: number;
        status: string;
        dueDate?: string;
    }[];
}

const fetchDashboardData = async (period: string): Promise<DashboardData> => {
    const res = await fetch(`/api/dashboard?period=${period}`);
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
};

export default function DashboardPage() {
    const { locale, t } = useI18n();
    const [dateRange, setDateRange] = useState("this_month");

    const { data, isLoading } = useQuery({
        queryKey: ["dashboard", dateRange],
        queryFn: () => fetchDashboardData(dateRange),
    });

    // Calculate business metrics
    const revenue = data?.revenue ?? 0;
    const cogs = data?.cogs ?? 0;
    const grossProfit = data?.grossProfit ?? (revenue - cogs);
    const expenses = data?.expenses ?? 0;
    const profit = data?.profit ?? (grossProfit - expenses);
    const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;
    const grossMargin = revenue > 0 ? ((grossProfit / revenue) * 100).toFixed(1) : 0;
    const pending = data?.pending ?? 0;
    const cash = data?.cash ?? 0;

    const unpaidInvoices = data?.recentInvoices?.filter(i => i.status !== 'PAID') ?? [];
    const overdueInvoices = data?.recentInvoices?.filter(i => i.status === 'OVERDUE') ?? [];
    const paidInvoices = data?.recentInvoices?.filter(i => i.status === 'PAID') ?? [];

    const collectionRate = data?.recentInvoices?.length
        ? ((paidInvoices.length / data.recentInvoices.length) * 100).toFixed(0)
        : 100;

    // Business health indicators with translations
    const getHealthStatus = () => {
        const healthLabels = {
            healthy: locale === "ar" ? "صحي" : "Healthy",
            fair: locale === "ar" ? "متوسط" : "Fair",
            needsAttention: locale === "ar" ? "يحتاج اهتمام" : "Needs Attention"
        };
        if (profit > 0 && Number(collectionRate) > 80) return { status: healthLabels.healthy, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" };
        if (profit > 0 && Number(collectionRate) > 50) return { status: healthLabels.fair, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" };
        return { status: healthLabels.needsAttention, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-900/20" };
    };
    const health = getHealthStatus();

    return (
        <div className="space-y-6">
            {/* Header with Business Health */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        {locale === "ar" ? "لوحة التحكم" : "Business Dashboard"}
                    </h1>
                    <p className="text-muted-foreground">
                        {locale === "ar" ? "نظرة شاملة على أداء عملك" : "Complete overview of your business performance"}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Business Health Badge */}
                    <div className={`px-4 py-2 rounded-full ${health.bg} ${health.color} font-medium flex items-center gap-2`}>
                        {health.status === "Healthy" ? <CheckCircle className="w-4 h-4" /> :
                            health.status === "Fair" ? <AlertTriangle className="w-4 h-4" /> :
                                <XCircle className="w-4 h-4" />}
                        {health.status}
                    </div>
                    {/* Date Range */}
                    <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-background">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="text-sm bg-transparent border-none outline-none"
                        >
                            <option value="today">{locale === "ar" ? "اليوم" : "Today"}</option>
                            <option value="this_week">{locale === "ar" ? "هذا الأسبوع" : "This Week"}</option>
                            <option value="this_month">{locale === "ar" ? "هذا الشهر" : "This Month"}</option>
                            <option value="this_quarter">{locale === "ar" ? "هذا الربع" : "This Quarter"}</option>
                            <option value="this_year">{locale === "ar" ? "هذه السنة" : "This Year"}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Main Financial Summary - Consistent Theme */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Revenue Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border rounded-xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <DollarSign className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600">
                            <ArrowUpRight className="w-4 h-4" />
                            <span className="text-sm font-medium">+12.5%</span>
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm mb-1">{locale === "ar" ? "إجمالي الإيرادات" : "Total Revenue"}</p>
                    <p className="text-2xl font-bold">{formatCurrency(revenue)}</p>
                </motion.div>

                {/* Expenses Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border rounded-xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Receipt className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600">
                            <ArrowDownRight className="w-4 h-4" />
                            <span className="text-sm font-medium">-3.2%</span>
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm mb-1">{locale === "ar" ? "إجمالي المصروفات" : "Total Expenses"}</p>
                    <p className="text-2xl font-bold">{formatCurrency(expenses)}</p>
                </motion.div>

                {/* Net Profit Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card border rounded-xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Target className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Percent className="w-4 h-4" />
                            <span className="text-sm font-medium">{profitMargin}%</span>
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm mb-1">{locale === "ar" ? "صافي الربح" : "Net Profit"}</p>
                    <p className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatCurrency(profit)}
                    </p>
                </motion.div>

                {/* Cash Balance Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card border rounded-xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Wallet className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600">
                            <ArrowUpRight className="w-4 h-4" />
                            <span className="text-sm font-medium">+5.4%</span>
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm mb-1">{locale === "ar" ? "الرصيد النقدي" : "Cash Balance"}</p>
                    <p className="text-2xl font-bold">{formatCurrency(cash)}</p>
                </motion.div>
            </div>

            {/* Quick Actions & Alerts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Receivables Status */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-card rounded-xl border p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            {locale === "ar" ? "حسابات القبض" : "Accounts Receivable"}
                        </h3>
                        <Link href="/payments" className="text-sm text-primary hover:underline">
                            {locale === "ar" ? "عرض الكل" : "View All"}
                        </Link>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">{locale === "ar" ? "إجمالي المعلق" : "Total Pending"}</span>
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
                                <p className="text-xs text-muted-foreground">{locale === "ar" ? "مدفوع" : "Paid"}</p>
                                <p className="font-bold text-emerald-600">{paidInvoices.length}</p>
                            </div>
                            <div className="p-2 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">{locale === "ar" ? "معلق" : "Pending"}</p>
                                <p className="font-bold text-amber-600">{unpaidInvoices.length}</p>
                            </div>
                            <div className="p-2 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">{locale === "ar" ? "متأخر" : "Overdue"}</p>
                                <p className="font-bold text-rose-600">{overdueInvoices.length}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-card rounded-xl border p-6"
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

                {/* Alerts & Notifications */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-card rounded-xl border p-6"
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
                                <Link href="/reports" className="ml-auto text-sm text-primary hover:underline">
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
            </div>

            {/* Revenue Chart & Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-card rounded-xl border p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            {locale === "ar" ? "اتجاه الإيرادات" : "Revenue Trend"}
                        </h3>
                        <Link href="/reports" className="text-sm text-primary hover:underline">
                            {locale === "ar" ? "التقرير الكامل" : "Full Report"}
                        </Link>
                    </div>

                    {/* Simple Bar Chart */}
                    <div className="h-48 flex items-end justify-between gap-2">
                        {(data?.monthlyRevenue ?? [
                            { name: 'Jan', value: 4000 },
                            { name: 'Feb', value: 3000 },
                            { name: 'Mar', value: 5000 },
                            { name: 'Apr', value: 4500 },
                            { name: 'May', value: 6000 },
                            { name: 'Jun', value: 5500 },
                        ]).map((month) => {
                            const maxValue = Math.max(...(data?.monthlyRevenue ?? [{ value: 6000 }]).map(m => m.value));
                            const height = (month.value / maxValue) * 100;
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

                {/* Recent Invoices */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-card rounded-xl border p-6"
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
                            [1, 2, 3, 4].map(i => (
                                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg animate-pulse">
                                    <div className="space-y-2">
                                        <div className="h-4 w-20 bg-muted rounded" />
                                        <div className="h-3 w-28 bg-muted rounded" />
                                    </div>
                                    <div className="h-4 w-16 bg-muted rounded" />
                                </div>
                            ))
                        ) : data?.recentInvoices?.length ? (
                            data.recentInvoices.slice(0, 5).map((invoice) => (
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
                                <Link href="/invoices/new" className="text-primary hover:underline text-sm">
                                    {locale === "ar" ? "أنشئ أول فاتورة" : "Create your first invoice"}
                                </Link>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Financial Summary Footer */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-primary rounded-xl p-6 text-primary-foreground"
            >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-semibold mb-2">{locale === "ar" ? "الملخص المالي" : "Financial Summary"}</h3>
                        <div className="opacity-90 text-sm space-y-1">
                            <p>
                                <span className="opacity-70">{locale === "ar" ? "الإيرادات:" : "Revenue:"}</span> {formatCurrency(revenue)}
                                <span className="opacity-70 mx-2">−</span>
                                <span className="opacity-70">{locale === "ar" ? "تكلفة البضاعة:" : "COGS:"}</span> {formatCurrency(cogs)}
                                <span className="opacity-70 mx-2">=</span>
                                <span className="font-semibold">{locale === "ar" ? "مجمل الربح:" : "Gross Profit:"} {formatCurrency(grossProfit)}</span>
                                <span className="text-xs ml-2 opacity-70">({grossMargin}% {locale === "ar" ? "هامش" : "margin"})</span>
                            </p>
                            <p>
                                <span className="opacity-70">{locale === "ar" ? "مجمل الربح:" : "Gross Profit:"}</span> {formatCurrency(grossProfit)}
                                <span className="opacity-70 mx-2">−</span>
                                <span className="opacity-70">{locale === "ar" ? "المصروفات:" : "Op. Expenses:"}</span> {formatCurrency(expenses)}
                                <span className="opacity-70 mx-2">=</span>
                                <span className={`font-semibold ${profit >= 0 ? '' : 'text-rose-200'}`}>
                                    {locale === "ar" ? "صافي الربح:" : "Net Profit:"} {formatCurrency(profit)}
                                </span>
                                <span className="text-xs ml-2 opacity-70">({profitMargin}% {locale === "ar" ? "هامش" : "margin"})</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            href="/reports"
                            className="flex items-center gap-2 px-4 py-2 bg-primary-foreground/10 rounded-lg hover:bg-primary-foreground/20 transition"
                        >
                            <PieChart className="w-4 h-4" />
                            {locale === "ar" ? "عرض التقارير" : "View Reports"}
                        </Link>
                        <Link
                            href="/reports/profit-loss"
                            className="flex items-center gap-2 px-4 py-2 bg-primary-foreground text-primary rounded-lg hover:opacity-90 transition"
                        >
                            <BarChart3 className="w-4 h-4" />
                            {locale === "ar" ? "قائمة الدخل" : "P&L Statement"}
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* AI Chat Widget */}
            <AIChat />
        </div>
    );
}
