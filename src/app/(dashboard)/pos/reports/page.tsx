"use client";

import { motion } from "framer-motion";
import { TrendingUp, ShoppingBag, DollarSign, Clock, CreditCard, Banknote, Smartphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface POSStats {
    todaySales: number;
    todayTransactions: number;
    avgTransaction: number;
    topProduct: { name: string; quantity: number; revenue: number } | null;
    topProducts: { name: string; quantity: number; revenue: number }[];
    paymentMethods: { method: string; amount: number }[];
    salesByHour: { hour: string; sales: number }[];
    lastWeekTotal: number;
}

const fetchStats = async (): Promise<POSStats> => {
    const res = await fetch("/api/pos/reports/stats");
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
};

const PAYMENT_COLORS: Record<string, string> = {
    CASH: "#22c55e",
    CARD: "#3b82f6",
    MOBILE: "#a855f7",
    BANK_TRANSFER: "#f59e0b",
    CREDIT: "#ef4444",
};

export default function POSReportsPage() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["pos-stats"],
        queryFn: fetchStats,
    });

    const growthPercent = stats?.lastWeekTotal
        ? ((stats.todaySales - stats.lastWeekTotal / 7) / (stats.lastWeekTotal / 7)) * 100
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">POS Analytics</h1>
                <p className="text-muted-foreground">Real-time sales performance and insights.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-border bg-card p-6"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <span className="text-sm text-muted-foreground">Today&apos;s Sales</span>
                    </div>
                    {isLoading ? (
                        <div className="h-8 w-24 skeleton rounded" />
                    ) : (
                        <>
                            <p className="text-3xl font-bold">{formatCurrency(stats?.todaySales || 0)}</p>
                            {growthPercent !== 0 && (
                                <p className={`text-sm mt-1 ${growthPercent > 0 ? "text-green-600" : "text-red-600"}`}>
                                    {growthPercent > 0 ? "↑" : "↓"} {Math.abs(growthPercent).toFixed(1)}% vs daily avg
                                </p>
                            )}
                        </>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl border border-border bg-card p-6"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="text-sm text-muted-foreground">Transactions</span>
                    </div>
                    {isLoading ? (
                        <div className="h-8 w-16 skeleton rounded" />
                    ) : (
                        <p className="text-3xl font-bold">{stats?.todayTransactions || 0}</p>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl border border-border bg-card p-6"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-purple-600" />
                        </div>
                        <span className="text-sm text-muted-foreground">Avg Transaction</span>
                    </div>
                    {isLoading ? (
                        <div className="h-8 w-20 skeleton rounded" />
                    ) : (
                        <p className="text-3xl font-bold">{formatCurrency(stats?.avgTransaction || 0)}</p>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl border border-border bg-card p-6"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <span className="text-sm text-muted-foreground">Top Product</span>
                    </div>
                    {isLoading ? (
                        <div className="h-8 w-24 skeleton rounded" />
                    ) : (
                        <p className="text-xl font-bold truncate">{stats?.topProduct?.name || "—"}</p>
                    )}
                </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Sales by Hour */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="font-semibold mb-4">Sales by Hour</h3>
                    {isLoading ? (
                        <div className="h-64 skeleton rounded" />
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={stats?.salesByHour?.filter(h => parseInt(h.hour) >= 8 && parseInt(h.hour) <= 22)}>
                                <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={12} />
                                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `$${v}`} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Payment Methods */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="font-semibold mb-4">Payment Methods</h3>
                    {isLoading ? (
                        <div className="h-64 skeleton rounded" />
                    ) : stats?.paymentMethods && stats.paymentMethods.length > 0 ? (
                        <div className="flex items-center gap-6">
                            <ResponsiveContainer width="50%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={stats.paymentMethods}
                                        dataKey="amount"
                                        nameKey="method"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                    >
                                        {stats.paymentMethods.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[entry.method] || "#888"} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex-1 space-y-3">
                                {stats.paymentMethods.map((pm) => (
                                    <div key={pm.method} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="h-3 w-3 rounded-full"
                                                style={{ backgroundColor: PAYMENT_COLORS[pm.method] }}
                                            />
                                            <span className="text-sm">{pm.method}</span>
                                        </div>
                                        <span className="font-medium">{formatCurrency(pm.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                            No sales data today
                        </div>
                    )}
                </div>
            </div>

            {/* Top Products */}
            <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-semibold mb-4">Top Selling Products</h3>
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-12 skeleton rounded" />
                        ))}
                    </div>
                ) : stats?.topProducts && stats.topProducts.length > 0 ? (
                    <div className="space-y-3">
                        {stats.topProducts.map((product, index) => (
                            <motion.div
                                key={product.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                        #{index + 1}
                                    </span>
                                    <div>
                                        <p className="font-medium">{product.name}</p>
                                        <p className="text-sm text-muted-foreground">{product.quantity} units sold</p>
                                    </div>
                                </div>
                                <p className="font-bold text-lg">{formatCurrency(product.revenue)}</p>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center py-8 text-muted-foreground">No sales data today</p>
                )}
            </div>
        </div>
    );
}
