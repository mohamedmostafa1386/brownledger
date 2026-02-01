"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n-context";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from "recharts";
import {
    Download, Calendar, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package,
    Users, FileText, CreditCard, AlertTriangle, CheckCircle, Clock, ArrowUpRight,
    ArrowDownRight, BarChart3, PieChartIcon, Table, Filter, RefreshCw
} from "lucide-react";
import { formatCurrency } from "@/lib/format";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function ReportsView() {
    const { t, locale } = useI18n();
    const [activeTab, setActiveTab] = useState<"overview" | "sales" | "receivables" | "purchases" | "inventory" | "clients">("overview");
    const [period, setPeriod] = useState("month");
    const [viewMode, setViewMode] = useState<"dashboard" | "table">("dashboard");

    const { data: stats, isLoading, refetch } = useQuery({
        queryKey: ["reports-stats", period],
        queryFn: () => fetch(`/api/reports/stats?period=${period}`).then((r) => r.json()),
    });

    const tabs = [
        { id: "overview", label: t("reports.tabs.overview"), icon: BarChart3 },
        { id: "sales", label: t("reports.tabs.sales"), icon: ShoppingCart },
        { id: "receivables", label: t("reports.tabs.receivables"), icon: CreditCard },
        { id: "purchases", label: t("reports.tabs.purchases"), icon: Package },
        { id: "inventory", label: t("reports.tabs.inventory"), icon: Package },
        { id: "clients", label: t("reports.tabs.clients"), icon: Users },
    ] as const;

    const periods = [
        { value: "week", label: t("dashboard.ranges.week") },
        { value: "month", label: t("dashboard.ranges.month") },
        { value: "quarter", label: t("dashboard.ranges.quarter") },
        { value: "year", label: t("dashboard.ranges.year") },
    ];

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold">{t("reports.title")}</h2>
                    <p className="text-muted-foreground text-sm">{t("reports.subtitle")}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="flex bg-muted rounded-lg p-1">
                        <button
                            onClick={() => setViewMode("dashboard")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${viewMode === "dashboard" ? "bg-background shadow" : ""}`}
                        >
                            <PieChartIcon className="w-4 h-4" />
                            {t("reports.controls.dashboard")}
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${viewMode === "table" ? "bg-background shadow" : ""}`}
                        >
                            <Table className="w-4 h-4" />
                            {t("reports.controls.table")}
                        </button>
                    </div>
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="h-9 px-4 rounded-lg border border-border bg-background text-sm"
                    >
                        {periods.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>
                    <button onClick={() => refetch()} className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 hover:bg-muted">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                        <Download className="h-4 w-4" />
                        {t("reports.controls.export")}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border overflow-x-auto">
                <nav className="flex gap-1 min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            data-testid={`report-tab-${tab.id}`}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    {/* Overview Tab */}
                    {activeTab === "overview" && (
                        <OverviewDashboard stats={stats} locale={locale} viewMode={viewMode} />
                    )}

                    {/* Sales Tab */}
                    {activeTab === "sales" && (
                        <SalesDashboard stats={stats} locale={locale} viewMode={viewMode} />
                    )}

                    {/* Receivables Tab */}
                    {activeTab === "receivables" && (
                        <ReceivablesDashboard stats={stats} locale={locale} viewMode={viewMode} />
                    )}

                    {/* Purchases Tab */}
                    {activeTab === "purchases" && (
                        <PurchasesDashboard stats={stats} locale={locale} viewMode={viewMode} />
                    )}

                    {/* Inventory Tab */}
                    {activeTab === "inventory" && (
                        <InventoryDashboard stats={stats} locale={locale} viewMode={viewMode} />
                    )}

                    {/* Clients Tab */}
                    {activeTab === "clients" && (
                        <ClientsDashboard stats={stats} locale={locale} viewMode={viewMode} />
                    )}
                </>
            )}
        </div>
    );
}

// Overview Dashboard
function OverviewDashboard({ stats, locale, viewMode }: { stats: any; locale: string; viewMode: string }) {
    const { t } = useI18n();
    const kpis = [
        { title: t("reports.kpi.totalRevenue"), value: stats?.revenue || 0, change: stats?.revenueChange || 0, icon: DollarSign, color: "green" },
        { title: t("reports.kpi.totalExpenses"), value: stats?.expenses || 0, change: stats?.expensesChange || 0, icon: CreditCard, color: "red", negative: true },
        { title: t("reports.kpi.netProfit"), value: stats?.profit || 0, change: stats?.profitChange || 0, icon: TrendingUp, color: "blue" },
        { title: t("reports.kpi.cashFlow"), value: stats?.cashFlow || 0, change: stats?.cashFlowChange || 0, icon: ArrowUpRight, color: "purple" },
    ];

    if (viewMode === "table") {
        return (
            <div className="space-y-6">
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/50">
                        <h3 className="font-semibold">{t("reports.tabs.overview")}</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="text-left p-3 font-medium">{t("reports.tableHeaders.metric")}</th>
                                <th className="text-right p-3 font-medium">{t("reports.tableHeaders.currentPeriod")}</th>
                                <th className="text-right p-3 font-medium">{t("reports.tableHeaders.change")}</th>
                                <th className="text-right p-3 font-medium">{t("reports.tableHeaders.status")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {kpis.map((kpi, i) => (
                                <tr key={i} className="border-t border-border">
                                    <td className="p-3 font-medium">{kpi.title}</td>
                                    <td className="p-3 text-right">{formatCurrency(kpi.value, locale, "EGP")}</td>
                                    <td className={`p-3 text-right ${kpi.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                                        {kpi.change >= 0 ? "+" : ""}{kpi.change}%
                                    </td>
                                    <td className="p-3 text-right">
                                        {kpi.change >= 0 ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                                <CheckCircle className="w-3 h-3" /> {t("dashboard.health.healthy")}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                                <AlertTriangle className="w-3 h-3" /> {t("dashboard.health.needsAttention")}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/50">
                        <h3 className="font-semibold">{t("dashboard.monthlyBreakdown")}</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="text-left p-3 font-medium">{t("reports.tableHeaders.month")}</th>
                                <th className="text-right p-3 font-medium">{t("reports.tableHeaders.revenue")}</th>
                                <th className="text-right p-3 font-medium">{t("reports.tableHeaders.expenses")}</th>
                                <th className="text-right p-3 font-medium">{t("reports.tableHeaders.profit")}</th>
                                <th className="text-right p-3 font-medium">{t("reports.tableHeaders.margin")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(stats?.monthlyData || []).map((row: any, i: number) => (
                                <tr key={i} className="border-t border-border">
                                    <td className="p-3 font-medium">{row.month}</td>
                                    <td className="p-3 text-right text-green-600">{formatCurrency(row.revenue, locale, "EGP")}</td>
                                    <td className="p-3 text-right text-red-600">{formatCurrency(row.expenses, locale, "EGP")}</td>
                                    <td className="p-3 text-right text-blue-600">{formatCurrency(row.profit, locale, "EGP")}</td>
                                    <td className="p-3 text-right">{row.revenue > 0 ? ((row.profit / row.revenue) * 100).toFixed(1) : 0}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => (
                    <KPICard key={i} {...kpi} locale={locale} />
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title={t("reports.charts.revenueVsExpenses")}>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={stats?.monthlyData || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                            <Tooltip formatter={(v: number) => formatCurrency(v, locale, "EGP")} />
                            <Legend />
                            <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} name={t("reports.tableHeaders.revenue")} />
                            <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name={t("reports.tableHeaders.expenses")} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title={t("reports.charts.profitTrend")}>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={stats?.monthlyData || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                            <Tooltip formatter={(v: number) => formatCurrency(v, locale, "EGP")} />
                            <Area type="monotone" dataKey="profit" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name={t("reports.tableHeaders.profit")} />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title={t("reports.charts.expensesByCategory")}>
                    <div className="flex items-center h-[280px]">
                        <ResponsiveContainer width="50%" height="100%">
                            <PieChart>
                                <Pie data={stats?.expensesByCategory || []} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                                    {(stats?.expensesByCategory || []).map((_: any, i: number) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: number) => formatCurrency(v, locale, "EGP")} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-2">
                            {(stats?.expensesByCategory || []).map((item: any, i: number) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                        <span className="text-sm">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-medium">{formatCurrency(item.value, locale, "EGP")}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </ChartCard>

                <ChartCard title={t("reports.charts.cashFlowForecast")}>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={stats?.cashFlowForecast || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                            <Tooltip formatter={(v: number) => formatCurrency(v, locale, "EGP")} />
                            <Legend />
                            <Line type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={2} name={locale === "ar" ? "فعلي" : "Actual"} />
                            <Line type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name={locale === "ar" ? "متوقع" : "Forecast"} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}

// Sales Dashboard
function SalesDashboard({ stats, locale, viewMode }: { stats: any; locale: string; viewMode: string }) {
    const { t } = useI18n();
    const kpis = [
        { title: t("reports.kpi.totalSales"), value: stats?.totalSales || 0, change: 12, icon: DollarSign, color: "green" },
        { title: t("reports.kpi.invoiceCount"), value: stats?.invoiceCount || 0, change: 5, icon: FileText, color: "blue", isCount: true },
        { title: t("reports.kpi.avgOrderValue"), value: stats?.avgOrderValue || 0, change: 8, icon: ShoppingCart, color: "purple" },
        { title: t("reports.kpi.topClientRevenue"), value: stats?.topClientRevenue || 0, change: 15, icon: Users, color: "amber" },
    ];

    if (viewMode === "table") {
        return (
            <div className="space-y-6">
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/50">
                        <h3 className="font-semibold">{t("reports.charts.salesByClient")}</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="text-left p-3 font-medium">{t("reports.tableHeaders.rank")}</th>
                                <th className="text-left p-3 font-medium">{t("reports.tableHeaders.clientName")}</th>
                                <th className="text-right p-3 font-medium">{t("reports.kpi.totalSales")}</th>
                                <th className="text-right p-3 font-medium">{t("reports.tableHeaders.share")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(stats?.salesByClient || []).map((row: any, i: number) => (
                                <tr key={i} className="border-t border-border">
                                    <td className="p-3">#{i + 1}</td>
                                    <td className="p-3 font-medium">{row.name}</td>
                                    <td className="p-3 text-right">{formatCurrency(row.value, locale, "EGP")}</td>
                                    <td className="p-3 text-right">{stats?.totalSales > 0 ? ((row.value / stats.totalSales) * 100).toFixed(1) : 0}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/50">
                        <h3 className="font-semibold">{t("reports.charts.salesTrend")}</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        <table className="w-full">
                            <thead className="bg-muted/30 sticky top-0">
                                <tr>
                                    <th className="text-left p-3 font-medium">{t("reports.tableHeaders.date")}</th>
                                    <th className="text-right p-3 font-medium">{t("reports.kpi.totalSales")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(stats?.salesTrend || []).map((row: any, i: number) => (
                                    <tr key={i} className="border-t border-border">
                                        <td className="p-3">{row.date}</td>
                                        <td className="p-3 text-right">{formatCurrency(row.sales, locale, "EGP")}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => (
                    <KPICard key={i} {...kpi} locale={locale} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title={t("reports.charts.salesByClient")}>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={stats?.salesByClient || []} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis type="number" tickFormatter={(v) => `${v / 1000}k`} />
                            <YAxis type="category" dataKey="name" width={100} />
                            <Tooltip formatter={(v: number) => formatCurrency(v, locale, "EGP")} />
                            <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title={t("reports.charts.salesTrend")}>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={stats?.salesTrend || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                            <Tooltip formatter={(v: number) => formatCurrency(v, locale, "EGP")} />
                            <Area type="monotone" dataKey="sales" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}

// Receivables Dashboard
function ReceivablesDashboard({ stats, locale, viewMode }: { stats: any; locale: string; viewMode: string }) {
    const { t } = useI18n();
    const arAgingData = [
        { bucket: t("reports.kpi.current"), amount: (stats?.topClientRevenue || 0) * 0.4, color: "#22c55e" },
        { bucket: "1-30 days", amount: (stats?.topClientRevenue || 0) * 0.25, color: "#3b82f6" },
        { bucket: "31-60 days", amount: (stats?.topClientRevenue || 0) * 0.15, color: "#f59e0b" },
        { bucket: "61-90 days", amount: (stats?.topClientRevenue || 0) * 0.12, color: "#ef4444" },
        { bucket: t("reports.kpi.over90"), amount: (stats?.topClientRevenue || 0) * 0.08, color: "#7f1d1d" },
    ];
    const totalAR = arAgingData.reduce((s, a) => s + a.amount, 0);

    if (viewMode === "table") {
        return (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/50">
                    <h3 className="font-semibold">{t("reports.charts.arAging")}</h3>
                </div>
                <table className="w-full">
                    <thead className="bg-muted/30">
                        <tr>
                            <th className="text-left p-3 font-medium">{t("reports.tableHeaders.agingBucket")}</th>
                            <th className="text-right p-3 font-medium">{t("reports.tableHeaders.amount")}</th>
                            <th className="text-right p-3 font-medium">{t("reports.tableHeaders.share")}</th>
                            <th className="text-left p-3 font-medium">{t("reports.tableHeaders.riskLevel")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {arAgingData.map((row, i) => (
                            <tr key={i} className="border-t border-border">
                                <td className="p-3 font-medium">{row.bucket}</td>
                                <td className="p-3 text-right">{formatCurrency(row.amount, locale, "EGP")}</td>
                                <td className="p-3 text-right">{totalAR > 0 ? ((row.amount / totalAR) * 100).toFixed(1) : 0}%</td>
                                <td className="p-3">
                                    <span className="px-2 py-1 rounded text-xs" style={{ backgroundColor: `${row.color}20`, color: row.color }}>
                                        {i === 0 ? t("reports.riskLevels.low") : i < 3 ? t("reports.riskLevels.medium") : t("reports.riskLevels.high")}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        <tr className="border-t-2 border-border font-bold bg-muted/30">
                            <td className="p-3">{t("reports.totalOutstanding")}</td>
                            <td className="p-3 text-right">{formatCurrency(totalAR, locale, "EGP")}</td>
                            <td className="p-3 text-right">100%</td>
                            <td className="p-3"></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title={t("reports.kpi.totalAR")} value={totalAR} change={-5} icon={CreditCard} color="blue" locale={locale} />
                <KPICard title={t("reports.kpi.current")} value={arAgingData[0].amount} change={10} icon={CheckCircle} color="green" locale={locale} />
                <KPICard title={t("reports.kpi.overdue")} value={arAgingData.slice(1).reduce((s, a) => s + a.amount, 0)} change={-8} icon={Clock} color="amber" locale={locale} />
                <KPICard title={t("reports.kpi.over90")} value={arAgingData[4].amount} change={-12} icon={AlertTriangle} color="red" locale={locale} negative />
            </div>

            <ChartCard title={t("reports.charts.arAging")}>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={arAgingData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="bucket" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                        <Tooltip formatter={(v: number) => formatCurrency(v, locale, "EGP")} />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                            {arAgingData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
}

// Purchases Dashboard
function PurchasesDashboard({ stats, locale, viewMode }: { stats: any; locale: string; viewMode: string }) {
    const { t } = useI18n();
    if (viewMode === "table") {
        return (
            <div className="space-y-6">
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/50">
                        <h3 className="font-semibold">{t("reports.charts.purchasesBySupplier")}</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="text-left p-3 font-medium">{t("reports.tableHeaders.supplier")}</th>
                                <th className="text-right p-3 font-medium">{t("reports.kpi.totalPurchases")}</th>
                                <th className="text-right p-3 font-medium">{t("reports.tableHeaders.share")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(stats?.purchasesBySupplier || []).map((row: any, i: number) => (
                                <tr key={i} className="border-t border-border">
                                    <td className="p-3 font-medium">{row.name}</td>
                                    <td className="p-3 text-right">{formatCurrency(row.value, locale, "EGP")}</td>
                                    <td className="p-3 text-right">{stats?.totalPurchases > 0 ? ((row.value / stats.totalPurchases) * 100).toFixed(1) : 0}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/50">
                        <h3 className="font-semibold">{t("reports.charts.apAging")}</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="text-left p-3 font-medium">{t("reports.tableHeaders.agingBucket")}</th>
                                <th className="text-right p-3 font-medium">{t("reports.tableHeaders.amount")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(stats?.apAgingBuckets || []).map((row: any, i: number) => (
                                <tr key={i} className="border-t border-border">
                                    <td className="p-3">{row.bucket}</td>
                                    <td className="p-3 text-right">{formatCurrency(row.amount, locale, "EGP")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title={t("reports.kpi.totalPurchases")} value={stats?.totalPurchases || 0} change={-5} icon={Package} color="red" locale={locale} negative />
                <KPICard title={t("reports.kpi.pendingBills")} value={stats?.pendingBills || 0} change={3} icon={FileText} color="amber" locale={locale} isCount />
                <KPICard title={t("reports.kpi.apBalance")} value={stats?.apAging || 0} change={-2} icon={CreditCard} color="blue" locale={locale} />
                <KPICard title={t("reports.kpi.topSupplierSpend")} value={stats?.topSupplierSpend || 0} change={10} icon={Users} color="purple" locale={locale} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title={t("reports.charts.purchasesBySupplier")}>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={stats?.purchasesBySupplier || []} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis type="number" tickFormatter={(v) => `${v / 1000}k`} />
                            <YAxis type="category" dataKey="name" width={100} />
                            <Tooltip formatter={(v: number) => formatCurrency(v, locale, "EGP")} />
                            <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title={t("reports.charts.apAging")}>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={stats?.apAgingBuckets || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="bucket" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                            <Tooltip formatter={(v: number) => formatCurrency(v, locale, "EGP")} />
                            <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}

// Inventory Dashboard
function InventoryDashboard({ stats, locale, viewMode }: { stats: any; locale: string; viewMode: string }) {
    const { t } = useI18n();
    if (viewMode === "table") {
        return (
            <div className="space-y-6">
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/50">
                        <h3 className="font-semibold">{t("reports.charts.stockValuation")}</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="text-left p-3 font-medium">{t("reports.tableHeaders.category")}</th>
                                <th className="text-right p-3 font-medium">{t("reports.tableHeaders.amount")}</th>
                                <th className="text-right p-3 font-medium">{t("reports.tableHeaders.share")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(stats?.stockByCategory || []).map((row: any, i: number) => (
                                <tr key={i} className="border-t border-border">
                                    <td className="p-3 font-medium">{row.name}</td>
                                    <td className="p-3 text-right">{formatCurrency(row.value, locale, "EGP")}</td>
                                    <td className="p-3 text-right">{stats?.inventoryValue > 0 ? ((row.value / stats.inventoryValue) * 100).toFixed(1) : 0}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/50">
                        <h3 className="font-semibold">{t("reports.charts.stockMovements")}</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="text-left p-3 font-medium">{t("reports.tableHeaders.currentPeriod")}</th>
                                <th className="text-right p-3 font-medium">{t("reports.tableHeaders.stockIn")}</th>
                                <th className="text-right p-3 font-medium">{t("reports.tableHeaders.stockOut")}</th>
                                <th className="text-right p-3 font-medium">{t("reports.tableHeaders.netChange")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(stats?.stockMovements || []).map((row: any, i: number) => (
                                <tr key={i} className="border-t border-border">
                                    <td className="p-3">{row.date}</td>
                                    <td className="p-3 text-right text-green-600">+{row.in}</td>
                                    <td className="p-3 text-right text-red-600">-{row.out}</td>
                                    <td className={`p-3 text-right ${row.in - row.out >= 0 ? "text-green-600" : "text-red-600"}`}>
                                        {row.in - row.out >= 0 ? "+" : ""}{row.in - row.out}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title={t("reports.kpi.inventoryValue")} value={stats?.inventoryValue || 0} change={5} icon={DollarSign} color="blue" locale={locale} />
                <KPICard title={t("reports.kpi.lowStock")} value={stats?.lowStockCount || 0} change={-2} icon={AlertTriangle} color="amber" locale={locale} isCount />
                <KPICard title={t("reports.kpi.outOfStock")} value={stats?.outOfStockCount || 0} change={1} icon={AlertTriangle} color="red" locale={locale} isCount negative />
                <KPICard title={t("reports.kpi.turnoverRate")} value={stats?.turnoverRate || 0} change={5} icon={RefreshCw} color="green" locale={locale} isPercent />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title={t("reports.charts.stockValuation")}>
                    <div className="flex items-center h-[280px]">
                        <ResponsiveContainer width="50%" height="100%">
                            <PieChart>
                                <Pie data={stats?.stockByCategory || []} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                                    {(stats?.stockByCategory || []).map((_: any, i: number) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: number) => formatCurrency(v, locale, "EGP")} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-2">
                            {(stats?.stockByCategory || []).map((item: any, i: number) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                        <span className="text-sm">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-medium">{formatCurrency(item.value, locale, "EGP")}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </ChartCard>

                <ChartCard title={t("reports.charts.stockMovements")}>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={stats?.stockMovements || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="in" fill="#22c55e" name={t("reports.tableHeaders.stockIn")} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="out" fill="#ef4444" name={t("reports.tableHeaders.stockOut")} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}

// Clients Dashboard
function ClientsDashboard({ stats, locale, viewMode }: { stats: any; locale: string; viewMode: string }) {
    const { t } = useI18n();
    const clientData = stats?.salesByClient || [];
    const totalRevenue = clientData.reduce((s: number, c: any) => s + c.value, 0);

    if (viewMode === "table") {
        return (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/50">
                    <h3 className="font-semibold">{t("reports.charts.revenueByClient")}</h3>
                </div>
                <table className="w-full">
                    <thead className="bg-muted/30">
                        <tr>
                            <th className="text-left p-3 font-medium">{t("reports.tableHeaders.rank")}</th>
                            <th className="text-left p-3 font-medium">{t("reports.tableHeaders.clientName")}</th>
                            <th className="text-right p-3 font-medium">{t("reports.kpi.totalRevenue")}</th>
                            <th className="text-right p-3 font-medium">{t("reports.tableHeaders.share")}</th>
                            <th className="text-left p-3 font-medium">{t("reports.tableHeaders.tier")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientData.map((client: any, i: number) => (
                            <tr key={i} className="border-t border-border">
                                <td className="p-3">#{i + 1}</td>
                                <td className="p-3 font-medium">{client.name}</td>
                                <td className="p-3 text-right">{formatCurrency(client.value, locale, "EGP")}</td>
                                <td className="p-3 text-right">{totalRevenue > 0 ? ((client.value / totalRevenue) * 100).toFixed(1) : 0}%</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs ${i === 0 ? "bg-yellow-100 text-yellow-700" :
                                        i < 3 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                                        }`}>
                                        {i === 0 ? t("reports.clientTiers.gold") : i < 3 ? t("reports.clientTiers.silver") : t("reports.clientTiers.standard")}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title={t("reports.kpi.totalClients")} value={stats?.totalClients || 0} change={12} icon={Users} color="blue" locale={locale} isCount />
                <KPICard title={t("reports.kpi.avgRevenueClient")} value={stats?.avgRevenuePerClient || 0} change={8} icon={DollarSign} color="green" locale={locale} />
                <KPICard title={t("reports.kpi.clientConcentration")} value={stats?.topClientConcentration || 0} change={2} icon={PieChartIcon} color="purple" locale={locale} isPercent />
                <KPICard title={t("reports.kpi.invoiceCount")} value={stats?.invoiceCount || 0} change={5} icon={FileText} color="amber" locale={locale} isCount />
            </div>

            <ChartCard title={t("reports.charts.revenueByClient")}>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={clientData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" tickFormatter={(v) => `${v / 1000}k`} />
                        <YAxis type="category" dataKey="name" width={120} />
                        <Tooltip formatter={(v: number) => formatCurrency(v, locale, "EGP")} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {clientData.map((_: any, i: number) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
}

// Reusable Components
function KPICard({ title, value, change, icon: Icon, color, locale, negative = false, isCount = false, isPercent = false }: any) {
    const { t } = useI18n();
    const colorClasses: Record<string, string> = {
        green: "bg-green-100 text-green-600",
        red: "bg-red-100 text-red-600",
        blue: "bg-blue-100 text-blue-600",
        purple: "bg-purple-100 text-purple-600",
        amber: "bg-amber-100 text-amber-600",
    };

    const formattedValue = isCount ? value.toString() : isPercent ? `${value.toFixed(1)}%` : formatCurrency(value, locale, "EGP");

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-card rounded-lg border border-border">
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{title}</p>
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <p className={`text-2xl font-bold ${negative ? "text-red-600" : ""}`}>{formattedValue}</p>
            <div className={`flex items-center gap-1 mt-2 text-sm ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
                {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                <span>{Math.abs(change)}% {t("reports.vsLastPeriod")}</span>
            </div>
        </motion.div>
    );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 bg-card rounded-lg border border-border">
            <h3 className="font-semibold mb-4">{title}</h3>
            {children}
        </motion.div>
    );
}
