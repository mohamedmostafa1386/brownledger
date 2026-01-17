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

export default function ReportsPage() {
    const { t, locale } = useI18n();
    const [activeTab, setActiveTab] = useState<"overview" | "sales" | "receivables" | "purchases" | "inventory" | "clients">("overview");
    const [period, setPeriod] = useState("month");
    const [viewMode, setViewMode] = useState<"dashboard" | "table">("dashboard");

    const { data: stats, isLoading, refetch } = useQuery({
        queryKey: ["reports-stats", period],
        queryFn: () => fetch(`/api/reports/stats?period=${period}`).then((r) => r.json()),
    });

    const tabs = [
        { id: "overview", label: "Overview", icon: BarChart3 },
        { id: "sales", label: "Sales & Revenue", icon: ShoppingCart },
        { id: "receivables", label: "Receivables", icon: CreditCard },
        { id: "purchases", label: "Purchases", icon: Package },
        { id: "inventory", label: "Inventory", icon: Package },
        { id: "clients", label: "Clients", icon: Users },
    ] as const;

    const periods = [
        { value: "week", label: "This Week" },
        { value: "month", label: "This Month" },
        { value: "quarter", label: "This Quarter" },
        { value: "year", label: "This Year" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Reports & Analytics</h1>
                    <p className="text-muted-foreground">Comprehensive business insights and performance metrics</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex bg-muted rounded-lg p-1">
                        <button
                            onClick={() => setViewMode("dashboard")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${viewMode === "dashboard" ? "bg-background shadow" : ""}`}
                        >
                            <PieChartIcon className="w-4 h-4" />
                            Dashboard
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${viewMode === "table" ? "bg-background shadow" : ""}`}
                        >
                            <Table className="w-4 h-4" />
                            Tables
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
                        Export
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border overflow-x-auto">
                <nav className="flex gap-1 min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
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
    const kpis = [
        { title: "Total Revenue", value: stats?.revenue || 0, change: stats?.revenueChange || 0, icon: DollarSign, color: "green" },
        { title: "Total Expenses", value: stats?.expenses || 0, change: stats?.expensesChange || 0, icon: CreditCard, color: "red", negative: true },
        { title: "Net Profit", value: stats?.profit || 0, change: stats?.profitChange || 0, icon: TrendingUp, color: "blue" },
        { title: "Cash Flow", value: stats?.cashFlow || 0, change: stats?.cashFlowChange || 0, icon: ArrowUpRight, color: "purple" },
    ];

    if (viewMode === "table") {
        return (
            <div className="space-y-6">
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/50">
                        <h3 className="font-semibold">Financial Summary</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="text-left p-3 font-medium">Metric</th>
                                <th className="text-right p-3 font-medium">Current Period</th>
                                <th className="text-right p-3 font-medium">Change</th>
                                <th className="text-right p-3 font-medium">Status</th>
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
                                                <CheckCircle className="w-3 h-3" /> Good
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                                                <AlertTriangle className="w-3 h-3" /> Attention
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
                        <h3 className="font-semibold">Monthly Performance</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="text-left p-3 font-medium">Month</th>
                                <th className="text-right p-3 font-medium">Revenue</th>
                                <th className="text-right p-3 font-medium">Expenses</th>
                                <th className="text-right p-3 font-medium">Profit</th>
                                <th className="text-right p-3 font-medium">Margin</th>
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
                <ChartCard title="Revenue vs Expenses">
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={stats?.monthlyData || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                            <Tooltip formatter={(v: number) => formatCurrency(v, locale, "EGP")} />
                            <Legend />
                            <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} name="Revenue" />
                            <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Profit Trend">
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={stats?.monthlyData || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                            <Tooltip formatter={(v: number) => formatCurrency(v, locale, "EGP")} />
                            <Area type="monotone" dataKey="profit" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Expenses by Category">
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

                <ChartCard title="Cash Flow Forecast">
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={stats?.cashFlowForecast || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                            <Tooltip formatter={(v: number) => formatCurrency(v, locale, "EGP")} />
                            <Legend />
                            <Line type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={2} name="Actual" />
                            <Line type="monotone" dataKey="forecast" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="Forecast" />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}

// Sales Dashboard
function SalesDashboard({ stats, locale, viewMode }: { stats: any; locale: string; viewMode: string }) {
    const kpis = [
        { title: "Total Sales", value: stats?.totalSales || 0, change: 12, icon: DollarSign, color: "green" },
        { title: "Invoice Count", value: stats?.invoiceCount || 0, change: 5, icon: FileText, color: "blue", isCount: true },
        { title: "Avg Order Value", value: stats?.avgOrderValue || 0, change: 8, icon: ShoppingCart, color: "purple" },
        { title: "Top Client Revenue", value: stats?.topClientRevenue || 0, change: 15, icon: Users, color: "amber" },
    ];

    if (viewMode === "table") {
        return (
            <div className="space-y-6">
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/50">
                        <h3 className="font-semibold">Sales by Client</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="text-left p-3 font-medium">Rank</th>
                                <th className="text-left p-3 font-medium">Client Name</th>
                                <th className="text-right p-3 font-medium">Total Sales</th>
                                <th className="text-right p-3 font-medium">% of Total</th>
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
                        <h3 className="font-semibold">Daily Sales Trend</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        <table className="w-full">
                            <thead className="bg-muted/30 sticky top-0">
                                <tr>
                                    <th className="text-left p-3 font-medium">Date</th>
                                    <th className="text-right p-3 font-medium">Sales</th>
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
                <ChartCard title="Sales by Client (Top 5)">
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

                <ChartCard title="Sales Trend">
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
    const arAgingData = [
        { bucket: "Current", amount: (stats?.topClientRevenue || 0) * 0.4, color: "#22c55e" },
        { bucket: "1-30 days", amount: (stats?.topClientRevenue || 0) * 0.25, color: "#3b82f6" },
        { bucket: "31-60 days", amount: (stats?.topClientRevenue || 0) * 0.15, color: "#f59e0b" },
        { bucket: "61-90 days", amount: (stats?.topClientRevenue || 0) * 0.12, color: "#ef4444" },
        { bucket: "90+ days", amount: (stats?.topClientRevenue || 0) * 0.08, color: "#7f1d1d" },
    ];
    const totalAR = arAgingData.reduce((s, a) => s + a.amount, 0);

    if (viewMode === "table") {
        return (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/50">
                    <h3 className="font-semibold">Accounts Receivable Aging</h3>
                </div>
                <table className="w-full">
                    <thead className="bg-muted/30">
                        <tr>
                            <th className="text-left p-3 font-medium">Aging Bucket</th>
                            <th className="text-right p-3 font-medium">Amount</th>
                            <th className="text-right p-3 font-medium">% of Total</th>
                            <th className="text-left p-3 font-medium">Risk Level</th>
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
                                        {i === 0 ? "Low" : i < 3 ? "Medium" : "High"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        <tr className="border-t-2 border-border font-bold bg-muted/30">
                            <td className="p-3">Total Outstanding</td>
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
                <KPICard title="Total A/R" value={totalAR} change={-5} icon={CreditCard} color="blue" locale={locale} />
                <KPICard title="Current" value={arAgingData[0].amount} change={10} icon={CheckCircle} color="green" locale={locale} />
                <KPICard title="Overdue" value={arAgingData.slice(1).reduce((s, a) => s + a.amount, 0)} change={-8} icon={Clock} color="amber" locale={locale} />
                <KPICard title="90+ Days" value={arAgingData[4].amount} change={-12} icon={AlertTriangle} color="red" locale={locale} negative />
            </div>

            <ChartCard title="A/R Aging Analysis">
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
    if (viewMode === "table") {
        return (
            <div className="space-y-6">
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/50">
                        <h3 className="font-semibold">Purchases by Supplier</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="text-left p-3 font-medium">Supplier</th>
                                <th className="text-right p-3 font-medium">Total Purchases</th>
                                <th className="text-right p-3 font-medium">% of Total</th>
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
                        <h3 className="font-semibold">A/P Aging</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="text-left p-3 font-medium">Aging Bucket</th>
                                <th className="text-right p-3 font-medium">Amount</th>
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
                <KPICard title="Total Purchases" value={stats?.totalPurchases || 0} change={-5} icon={Package} color="red" locale={locale} negative />
                <KPICard title="Pending Bills" value={stats?.pendingBills || 0} change={3} icon={FileText} color="amber" locale={locale} isCount />
                <KPICard title="A/P Balance" value={stats?.apAging || 0} change={-2} icon={CreditCard} color="blue" locale={locale} />
                <KPICard title="Top Supplier" value={stats?.topSupplierSpend || 0} change={10} icon={Users} color="purple" locale={locale} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Purchases by Supplier">
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

                <ChartCard title="A/P Aging Buckets">
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
    if (viewMode === "table") {
        return (
            <div className="space-y-6">
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/50">
                        <h3 className="font-semibold">Stock Valuation by Category</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="text-left p-3 font-medium">Category</th>
                                <th className="text-right p-3 font-medium">Value</th>
                                <th className="text-right p-3 font-medium">% of Total</th>
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
                        <h3 className="font-semibold">Stock Movements</h3>
                    </div>
                    <table className="w-full">
                        <thead className="bg-muted/30">
                            <tr>
                                <th className="text-left p-3 font-medium">Period</th>
                                <th className="text-right p-3 font-medium">Stock In</th>
                                <th className="text-right p-3 font-medium">Stock Out</th>
                                <th className="text-right p-3 font-medium">Net Change</th>
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
                <KPICard title="Inventory Value" value={stats?.inventoryValue || 0} change={3} icon={Package} color="blue" locale={locale} />
                <KPICard title="Low Stock Items" value={stats?.lowStockCount || 0} change={-2} icon={AlertTriangle} color="amber" locale={locale} isCount />
                <KPICard title="Out of Stock" value={stats?.outOfStockCount || 0} change={1} icon={AlertTriangle} color="red" locale={locale} isCount negative />
                <KPICard title="Turnover Rate" value={stats?.turnoverRate || 0} change={5} icon={RefreshCw} color="green" locale={locale} isPercent />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Stock Valuation by Category">
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

                <ChartCard title="Stock Movements">
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={stats?.stockMovements || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="in" fill="#22c55e" name="Stock In" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="out" fill="#ef4444" name="Stock Out" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}

// Clients Dashboard
function ClientsDashboard({ stats, locale, viewMode }: { stats: any; locale: string; viewMode: string }) {
    const clientData = stats?.salesByClient || [];
    const totalRevenue = clientData.reduce((s: number, c: any) => s + c.value, 0);

    if (viewMode === "table") {
        return (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/50">
                    <h3 className="font-semibold">Client Performance</h3>
                </div>
                <table className="w-full">
                    <thead className="bg-muted/30">
                        <tr>
                            <th className="text-left p-3 font-medium">Rank</th>
                            <th className="text-left p-3 font-medium">Client</th>
                            <th className="text-right p-3 font-medium">Revenue</th>
                            <th className="text-right p-3 font-medium">Share</th>
                            <th className="text-left p-3 font-medium">Tier</th>
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
                                        {i === 0 ? "Gold" : i < 3 ? "Silver" : "Standard"}
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
                <KPICard title="Total Clients" value={clientData.length} change={5} icon={Users} color="blue" locale={locale} isCount />
                <KPICard title="Top Client Revenue" value={clientData[0]?.value || 0} change={15} icon={TrendingUp} color="green" locale={locale} />
                <KPICard title="Avg Revenue/Client" value={clientData.length > 0 ? totalRevenue / clientData.length : 0} change={8} icon={DollarSign} color="purple" locale={locale} />
                <KPICard title="Client Concentration" value={clientData[0]?.value && totalRevenue > 0 ? (clientData[0].value / totalRevenue) * 100 : 0} change={-3} icon={PieChartIcon} color="amber" locale={locale} isPercent />
            </div>

            <ChartCard title="Revenue by Client">
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
                <span>{Math.abs(change)}% vs last period</span>
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
