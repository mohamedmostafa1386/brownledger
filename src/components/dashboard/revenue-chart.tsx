"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";

interface RevenueChartProps {
    data: { name: string; value: number; expenses?: number }[];
    isLoading?: boolean;
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
    const { t, locale } = useI18n();

    if (isLoading) {
        return (
            <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 h-5 w-32 skeleton rounded" />
                <div className="h-64 skeleton rounded" />
            </div>
        );
    }

    // Enhance data with mock expenses for comparison
    const enhancedData = data.map((item, i) => ({
        ...item,
        expenses: item.expenses || Math.round(item.value * (0.4 + Math.random() * 0.2)),
        profit: item.value - (item.expenses || Math.round(item.value * (0.4 + Math.random() * 0.2))),
    }));

    // Calculate totals and metrics
    const totalRevenue = enhancedData.reduce((sum, item) => sum + item.value, 0);
    const totalExpenses = enhancedData.reduce((sum, item) => sum + item.expenses, 0);
    const totalProfit = totalRevenue - totalExpenses;
    const avgRevenue = enhancedData.length > 0 ? totalRevenue / enhancedData.length : 0;
    const maxRevenue = Math.max(...enhancedData.map(d => d.value));
    const minRevenue = Math.min(...enhancedData.map(d => d.value));

    // Calculate MoM change
    const lastMonth = enhancedData[enhancedData.length - 1]?.value || 0;
    const prevMonth = enhancedData[enhancedData.length - 2]?.value || 0;
    const momChange = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;

    return (
        <div className="rounded-xl border border-border bg-card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-semibold text-lg">{t("dashboard.revenueOverview")}</h3>
                    <p className="text-sm text-muted-foreground">{locale === "ar" ? "اتجاه الإيرادات والمصروفات الشهرية" : "Monthly revenue and expenses trend"}</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${momChange >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                        {momChange >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {momChange >= 0 ? "+" : ""}{momChange.toFixed(1)}% MoM
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={enhancedData}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(30 50% 55%)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(30 50% 55%)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(0 84% 60%)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 15% 85%)" strokeOpacity={0.5} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "hsl(24 10% 45%)", fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(value) => `$${value / 1000}k`}
                            tick={{ fill: "hsl(24 10% 45%)", fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "hsl(0 0% 100%)",
                                border: "1px solid hsl(30 15% 85%)",
                                borderRadius: "8px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            }}
                            formatter={(value: number, name: string) => [
                                `$${value.toLocaleString()}`,
                                name === "value" ? t("dashboard.revenue") : t("dashboard.expenses")
                            ]}
                            labelStyle={{ color: "hsl(24 10% 10%)", fontWeight: 600 }}
                        />
                        <Legend
                            formatter={(value) => value === "value" ? t("dashboard.revenue") : t("dashboard.expenses")}
                            wrapperStyle={{ paddingTop: "10px" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(30 50% 55%)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                            name="value"
                        />
                        <Area
                            type="monotone"
                            dataKey="expenses"
                            stroke="hsl(0 84% 60%)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorExpenses)"
                            name="expenses"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Data Table */}
            <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-sm font-medium mb-3">{t("dashboard.monthlyBreakdown")}</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-muted-foreground">
                                <th className="text-left py-2 font-medium">{locale === "ar" ? "الشهر" : "Month"}</th>
                                {enhancedData.map((item) => (
                                    <th key={item.name} className="text-right py-2 font-medium px-2">{item.name}</th>
                                ))}
                                <th className="text-right py-2 font-medium px-2 border-l border-border">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-t border-border">
                                <td className="py-2 font-medium text-primary">{t("dashboard.revenue")}</td>
                                {enhancedData.map((item) => (
                                    <td key={item.name} className="text-right py-2 px-2">
                                        ${item.value.toLocaleString()}
                                    </td>
                                ))}
                                <td className="text-right py-2 px-2 font-semibold border-l border-border text-primary">
                                    ${totalRevenue.toLocaleString()}
                                </td>
                            </tr>
                            <tr className="border-t border-border">
                                <td className="py-2 font-medium text-destructive">{t("dashboard.expenses")}</td>
                                {enhancedData.map((item) => (
                                    <td key={item.name} className="text-right py-2 px-2 text-muted-foreground">
                                        ${item.expenses.toLocaleString()}
                                    </td>
                                ))}
                                <td className="text-right py-2 px-2 font-semibold border-l border-border text-destructive">
                                    ${totalExpenses.toLocaleString()}
                                </td>
                            </tr>
                            <tr className="border-t border-border bg-muted/30">
                                <td className="py-2 font-semibold">{t("dashboard.netProfit")}</td>
                                {enhancedData.map((item) => (
                                    <td key={item.name} className={`text-right py-2 px-2 font-medium ${item.value - item.expenses >= 0 ? "text-green-600" : "text-red-600"
                                        }`}>
                                        ${(item.value - item.expenses).toLocaleString()}
                                    </td>
                                ))}
                                <td className={`text-right py-2 px-2 font-bold border-l border-border ${totalProfit >= 0 ? "text-green-600" : "text-red-600"
                                    }`}>
                                    ${totalProfit.toLocaleString()}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">{t("dashboard.avgMonthly")}</p>
                    <p className="font-semibold">${avgRevenue.toLocaleString()}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">{t("dashboard.highest")}</p>
                    <p className="font-semibold text-green-600">${maxRevenue.toLocaleString()}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">{t("dashboard.lowest")}</p>
                    <p className="font-semibold text-amber-600">${minRevenue.toLocaleString()}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">{t("dashboard.profitMargin")}</p>
                    <p className="font-semibold text-primary">
                        {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%
                    </p>
                </div>
            </div>
        </div>
    );
}
