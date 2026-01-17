"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { TrendingUp, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ForecastData {
    month: string;
    predictedRevenue: number;
    predictedExpenses: number;
    netCashFlow: number;
    confidence: number;
}

export function CashFlowForecast() {
    const { data, isLoading, refetch, isFetching } = useQuery<{ forecast: ForecastData[] }>({
        queryKey: ["cashflow-forecast"],
        queryFn: () => fetch("/api/reports/ai-forecast?months=3").then((r) => r.json()),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">AI Cash Flow Forecast</h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Powered by AI
                    </span>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                    <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                </button>
            </div>

            {isLoading ? (
                <div className="h-64 skeleton rounded" />
            ) : (
                <>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data?.forecast || []}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    className="text-xs"
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                    className="text-xs"
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px",
                                    }}
                                    formatter={(value: number, name: string) => [
                                        formatCurrency(value),
                                        name.replace(/([A-Z])/g, " $1").trim(),
                                    ]}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="predictedRevenue"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={{ fill: "#10b981" }}
                                    name="Predicted Revenue"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="predictedExpenses"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    dot={{ fill: "#ef4444" }}
                                    name="Predicted Expenses"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="netCashFlow"
                                    stroke="#b89778"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    dot={{ fill: "#b89778" }}
                                    name="Net Cash Flow"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {data?.forecast && data.forecast.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                            {data.forecast.map((item) => (
                                <div key={item.month} className="bg-muted/50 rounded-lg p-3">
                                    <p className="text-xs text-muted-foreground">{item.month}</p>
                                    <p className="text-lg font-semibold text-green-600">
                                        {formatCurrency(item.netCashFlow)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {Math.round(item.confidence * 100)}% confidence
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
}
