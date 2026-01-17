"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Brain, AlertTriangle, TrendingUp, Lightbulb, RefreshCw } from "lucide-react";

interface Insight {
    type: "warning" | "opportunity" | "info";
    title: string;
    description: string;
    actionable: boolean;
    action?: string;
}

export function AIInsightsPanel() {
    const { data, isLoading, refetch, isFetching } = useQuery<{ insights: Insight[] }>({
        queryKey: ["ai-insights"],
        queryFn: () => fetch("/api/ai/insights").then((r) => r.json()),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const getIcon = (type: string) => {
        switch (type) {
            case "warning":
                return <AlertTriangle className="h-5 w-5 text-red-600" />;
            case "opportunity":
                return <TrendingUp className="h-5 w-5 text-green-600" />;
            default:
                return <Lightbulb className="h-5 w-5 text-blue-600" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case "warning":
                return "bg-red-100";
            case "opportunity":
                return "bg-green-100";
            default:
                return "bg-blue-100";
        }
    };

    return (
        <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Brain className="h-6 w-6 text-primary" />
                    <h3 className="text-lg font-semibold">AI Financial Insights</h3>
                </div>
                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                    <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-card/80 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 skeleton rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-32 skeleton rounded" />
                                    <div className="h-3 w-full skeleton rounded" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {data?.insights?.map((insight, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-card/80 backdrop-blur-sm rounded-lg p-4"
                        >
                            <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-full ${getBgColor(insight.type)}`}>
                                    {getIcon(insight.type)}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold">{insight.title}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {insight.description}
                                    </p>
                                    {insight.actionable && insight.action && (
                                        <button className="mt-2 text-sm text-primary hover:text-primary/80 font-medium">
                                            {insight.action} →
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {(!data?.insights || data.insights.length === 0) && (
                        <div className="text-center py-8 text-muted-foreground">
                            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No insights available. Add more data to get AI-powered recommendations.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
