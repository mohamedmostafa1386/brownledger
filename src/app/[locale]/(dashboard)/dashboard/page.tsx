
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    Calendar,
    Settings,
    LayoutDashboard,
    CheckCircle,
    AlertTriangle,
    XCircle
} from "lucide-react";
import { AIChat } from "@/components/dashboard/ai-chat";
import { useI18n } from "@/lib/i18n-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportsView } from "@/components/reports/ReportsView";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import { DashboardBuilder } from "@/components/dashboard/DashboardBuilder";
import { Button } from "@/components/ui/button";

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
    if (!res.ok) throw new Error("Failed to fetch data");
    return res.json();
};

const fetchDashboardConfig = async () => {
    const res = await fetch('/api/user/preferences');
    if (res.status === 401) return null;
    if (!res.ok) return null; // Fallback to default
    return res.json();
};

export default function DashboardPage() {
    const { locale, t } = useI18n();
    const queryClient = useQueryClient();
    const [dateRange, setDateRange] = useState("this_month");
    const [isEditing, setIsEditing] = useState(false);

    // Handle tab selection from URL
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const [activeTab, setActiveTab] = useState(tabParam === "analytics" ? "analytics" : "snapshot");

    useEffect(() => {
        if (tabParam === "analytics" || tabParam === "snapshot") {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    // Fetch Business Data
    const { data, isLoading } = useQuery({
        queryKey: ["dashboard", dateRange],
        queryFn: () => fetchDashboardData(dateRange),
    });

    // Fetch User Config
    const { data: config, isLoading: isConfigLoading } = useQuery({
        queryKey: ["dashboardConfig"],
        queryFn: fetchDashboardConfig,
    });

    const handleSaveConfig = async (newConfig: { widgets: string[] }) => {
        try {
            await fetch('/api/user/preferences', {
                method: 'POST',
                body: JSON.stringify(newConfig),
            });
            await queryClient.invalidateQueries({ queryKey: ["dashboardConfig"] });
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save config", error);
        }
    };

    // Business Health (derived from data)
    const profit = data?.profit ?? 0;
    const paidInvoices = data?.recentInvoices?.filter(i => i.status === 'PAID') ?? [];
    const collectionRate = data?.recentInvoices?.length
        ? ((paidInvoices.length / data.recentInvoices.length) * 100).toFixed(0)
        : 100;

    const getHealthStatus = () => {
        const healthLabels = {
            healthy: t("dashboard.health.healthy"),
            fair: t("dashboard.health.fair"),
            needsAttention: t("dashboard.health.needsAttention")
        };
        if (profit > 0 && Number(collectionRate) > 80) return { status: healthLabels.healthy, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" };
        if (profit > 0 && Number(collectionRate) > 50) return { status: healthLabels.fair, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" };
        return { status: healthLabels.needsAttention, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-900/20" };
    };
    const health = getHealthStatus();

    return (
        <div className="space-y-6">
            {/* Header with Business Health & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {t("dashboard.title")}
                    </h1>
                    <p className="text-muted-foreground">
                        {t("dashboard.subtitle")}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {/* Business Health Badge */}
                    <div className={`px-4 py-2 rounded-full ${health.bg} ${health.color} font-medium flex items-center gap-2 text-sm`}>
                        {health.status === "Healthy" ? <CheckCircle className="w-4 h-4" /> :
                            health.status === "Fair" ? <AlertTriangle className="w-4 h-4" /> :
                                <XCircle className="w-4 h-4" />}
                        {health.status}
                    </div>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="snapshot" className="flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4" />
                            {t("dashboard.snapshot")}
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="flex items-center gap-2">
                            <span className="bg-primary/10 p-0.5 rounded text-primary text-[10px] font-bold">New</span>
                            {t("dashboard.reports")}
                        </TabsTrigger>
                    </TabsList>

                    {activeTab === "snapshot" && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant={isEditing ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setIsEditing(!isEditing)}
                                className="hidden sm:flex"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                {isEditing ? t("dashboard.closeBuilder") : t("dashboard.customize")}
                            </Button>

                            {/* Date Range Selector */}
                            <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-background">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <select
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className="text-sm bg-transparent border-none outline-none cursor-pointer"
                                >
                                    <option value="today">{t("dashboard.ranges.today")}</option>
                                    <option value="this_week">{t("dashboard.ranges.week")}</option>
                                    <option value="this_month">{t("dashboard.ranges.month")}</option>
                                    <option value="this_quarter">{t("dashboard.ranges.quarter")}</option>
                                    <option value="this_year">{t("dashboard.ranges.year")}</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <TabsContent value="snapshot" className="space-y-6">
                    {isEditing && (
                        <DashboardBuilder
                            currentConfig={config}
                            onSave={handleSaveConfig}
                            onCancel={() => setIsEditing(false)}
                        />
                    )}

                    <DashboardGrid
                        config={config}
                        data={data}
                        isLoading={isLoading || isConfigLoading}
                        periodLabel={t(`dashboard.ranges.${dateRange.replace('this_', '').replace('today', 'today')}`)}
                    />
                </TabsContent>

                <TabsContent value="analytics">
                    <ReportsView />
                </TabsContent>
            </Tabs>

            {/* AI Chat Widget */}
            <AIChat />
        </div>
    );
}
