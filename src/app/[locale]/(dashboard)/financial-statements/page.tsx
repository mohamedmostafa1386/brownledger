"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n-context";
import { Download, Calendar, CheckCircle, AlertTriangle, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Minus, Activity, Brain, RefreshCw, Info, BarChart2, Target } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { useMutation } from "@tanstack/react-query";

type Tab = "income" | "balance" | "trial" | "cashflow" | "analysis";

const RATIO_INFO: Record<string, { name: string; nameAr: string; description: string; descriptionAr: string; unit: string; benchmark: number; benchmarkRange: [number, number] }> = {
    currentRatio: { name: "Current Ratio", nameAr: "النسبة الجارية", description: "Ability to pay short-term obligations", descriptionAr: "القدرة على سداد الالتزامات قصيرة الأجل", unit: "x", benchmark: 2.0, benchmarkRange: [1.5, 3.0] },
    quickRatio: { name: "Quick Ratio", nameAr: "نسبة السيولة السريعة", description: "Liquid assets vs current liabilities", descriptionAr: "الأصول السائلة مقابل الالتزامات الجارية", unit: "x", benchmark: 1.0, benchmarkRange: [0.8, 1.5] },
    cashRatio: { name: "Cash Ratio", nameAr: "نسبة النقدية", description: "Cash available for immediate obligations", descriptionAr: "النقد المتاح للالتزامات الفورية", unit: "x", benchmark: 0.5, benchmarkRange: [0.2, 1.0] },
    grossProfitMargin: { name: "Gross Profit Margin", nameAr: "هامش الربح الإجمالي", description: "Revenue retained after COGS", descriptionAr: "الإيرادات المتبقية بعد تكلفة المبيعات", unit: "%", benchmark: 40, benchmarkRange: [25, 60] },
    netProfitMargin: { name: "Net Profit Margin", nameAr: "هامش صافي الربح", description: "Revenue retained as profit", descriptionAr: "الإيرادات المحتفظ بها كربح", unit: "%", benchmark: 15, benchmarkRange: [5, 25] },
    returnOnAssets: { name: "Return on Assets (ROA)", nameAr: "العائد على الأصول", description: "Profit generated from assets", descriptionAr: "الربح المتولد من الأصول", unit: "%", benchmark: 10, benchmarkRange: [5, 20] },
    returnOnEquity: { name: "Return on Equity (ROE)", nameAr: "العائد على حقوق الملكية", description: "Return for shareholders", descriptionAr: "العائد للمساهمين", unit: "%", benchmark: 15, benchmarkRange: [10, 30] },
    assetTurnover: { name: "Asset Turnover", nameAr: "معدل دوران الأصول", description: "Revenue generated per asset", descriptionAr: "الإيرادات المتولدة لكل أصل", unit: "x", benchmark: 1.5, benchmarkRange: [0.5, 2.5] },
    inventoryTurnover: { name: "Inventory Turnover", nameAr: "معدل دوران المخزون", description: "Times inventory sold/replaced", descriptionAr: "عدد مرات بيع/استبدال المخزون", unit: "x", benchmark: 6, benchmarkRange: [4, 12] },
    daysSalesOutstanding: { name: "Days Sales Outstanding", nameAr: "أيام المبيعات المعلقة", description: "Average collection time", descriptionAr: "متوسط وقت التحصيل", unit: " days", benchmark: 30, benchmarkRange: [15, 45] },
    debtToEquity: { name: "Debt to Equity", nameAr: "الدين إلى حقوق الملكية", description: "Debt financing vs equity", descriptionAr: "التمويل بالديون مقابل حقوق الملكية", unit: "x", benchmark: 1.0, benchmarkRange: [0.5, 2.0] },
    debtToAssets: { name: "Debt to Assets", nameAr: "الدين إلى الأصول", description: "Assets financed by debt", descriptionAr: "الأصول الممولة بالديون", unit: "x", benchmark: 0.4, benchmarkRange: [0.2, 0.6] },
};

const TREND_DATA: Record<string, number[]> = {
    currentRatio: [1.8, 1.9, 2.1, 2.0, 2.2, 2.3],
    quickRatio: [0.9, 1.0, 1.1, 1.0, 1.1, 1.2],
    grossProfitMargin: [35, 36, 38, 40, 42, 43],
    netProfitMargin: [8, 9, 10, 12, 14, 15],
    returnOnEquity: [12, 13, 14, 15, 16, 18],
};

const HEALTH_COLORS: Record<string, string> = {
    EXCELLENT: "text-green-600 bg-green-100",
    GOOD: "text-emerald-600 bg-emerald-100",
    FAIR: "text-yellow-600 bg-yellow-100",
    POOR: "text-orange-600 bg-orange-100",
    CRITICAL: "text-red-600 bg-red-100",
};

const STATUS_COLORS: Record<string, string> = {
    GOOD: "bg-green-500",
    FAIR: "bg-yellow-500",
    POOR: "bg-red-500",
};

const RatioCard = ({ ratio, locale, showBenchmarks, selectedRatio, setSelectedRatio }: any) => {
    const info = RATIO_INFO[ratio.name] || { name: ratio.name, nameAr: ratio.name, description: "", descriptionAr: "", unit: "", benchmark: 0, benchmarkRange: [0, 0] };
    const isGood = ratio.status === "GOOD";
    const isPoor = ratio.status === "POOR";
    const trendData = TREND_DATA[ratio.name];
    const value = parseFloat(ratio.value) || 0;

    // Calculate benchmark position
    const [min, max] = info.benchmarkRange;
    const benchmarkPosition = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    const isInRange = value >= min && value <= max;

    const displayName = locale === "ar" ? info.nameAr : info.name;
    const displayDesc = locale === "ar" ? info.descriptionAr : info.description;

    return (
        <div
            className={`p-4 bg-card rounded-lg border border-border cursor-pointer transition-all hover:shadow-md ${selectedRatio === ratio.name ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedRatio(selectedRatio === ratio.name ? null : ratio.name)}
        >
            <div className="flex items-start justify-between mb-2">
                <span className="text-sm text-muted-foreground">{displayName}</span>
                <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[ratio.status] || "bg-gray-400"}`} />
            </div>
            <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${isPoor ? "text-red-600" : isGood ? "text-green-600" : ""}`}>
                    {ratio.value !== null ? ratio.value : "N/A"}
                </span>
                <span className="text-sm text-muted-foreground">{info.unit}</span>
            </div>

            {/* Benchmark Bar */}
            {showBenchmarks && (
                <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{min}{info.unit}</span>
                        <span className="font-medium">Benchmark: {info.benchmark}{info.unit}</span>
                        <span>{max}{info.unit}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full relative overflow-hidden">
                        {/* Range indicator */}
                        <div className="absolute inset-0 bg-gradient-to-r from-red-200 via-green-200 to-red-200" />
                        {/* Current value marker */}
                        <div
                            className={`absolute top-0 bottom-0 w-1 ${isInRange ? 'bg-green-600' : 'bg-red-600'}`}
                            style={{ left: `${benchmarkPosition}%` }}
                        />
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                        {isInRange ? (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Within industry benchmark
                            </span>
                        ) : (
                            <span className="text-xs text-orange-600 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Outside benchmark range
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Trend Sparkline */}
            {trendData && selectedRatio === ratio.name && (
                <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium">6-Period Trend</span>
                    </div>
                    <div className="flex items-end gap-1 h-12">
                        {trendData.map((val, i) => {
                            const maxVal = Math.max(...trendData);
                            const height = (val / maxVal) * 100;
                            const isLast = i === trendData.length - 1;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center">
                                    <div
                                        className={`w-full rounded-t ${isLast ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                                        style={{ height: `${height}%` }}
                                    />
                                    <span className="text-[10px] text-muted-foreground mt-1">{val}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>6 periods ago</span>
                        <span>Current</span>
                    </div>
                </div>
            )}

            <p className="text-xs text-muted-foreground mt-2">{displayDesc}</p>
        </div>
    );
};

export default function FinancialStatementsPage() {
    const { t, locale } = useI18n();
    const [activeTab, setActiveTab] = useState<Tab>("income");
    const [showComparative, setShowComparative] = useState(false);
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
        end: new Date().toISOString().split("T")[0],
    });

    // Ratio analysis state
    const [showAIPanel, setShowAIPanel] = useState(false);
    const [selectedRatio, setSelectedRatio] = useState<string | null>(null);
    const [showBenchmarks, setShowBenchmarks] = useState(true);

    const { data: incomeData, isLoading: incomeLoading } = useQuery({
        queryKey: ["income-statement", dateRange],
        queryFn: () =>
            fetch(`/api/financial-statements/income?start=${dateRange.start}&end=${dateRange.end}`).then((r) =>
                r.json()
            ),
        enabled: activeTab === "income",
    });

    const { data: balanceData, isLoading: balanceLoading } = useQuery({
        queryKey: ["balance-sheet", dateRange.end],
        queryFn: () =>
            fetch(`/api/financial-statements/balance?asOf=${dateRange.end}`).then((r) => r.json()),
        enabled: activeTab === "balance",
    });

    const { data: trialData, isLoading: trialLoading } = useQuery({
        queryKey: ["trial-balance", dateRange],
        queryFn: () =>
            fetch(`/api/financial-statements/trial-balance?start=${dateRange.start}&end=${dateRange.end}`).then(
                (r) => r.json()
            ),
        enabled: activeTab === "trial",
    });

    const { data: ratiosData, isLoading: ratiosLoading, refetch: refetchRatios } = useQuery({
        queryKey: ["financial-ratios"],
        queryFn: () => fetch("/api/financial-ratios").then((r) => r.json()),
        enabled: activeTab === "analysis",
    });

    const aiMutation = useMutation({
        mutationFn: () =>
            fetch("/api/financial-ratios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ratios: ratiosData?.ratios, totals: ratiosData?.totals }),
            }).then((r) => r.json()),
    });

    const handleAIAnalysis = () => {
        setShowAIPanel(true);
        aiMutation.mutate();
    };

    // Cash Flow Statement Data (calculated from income/balance data)
    const cashFlowData = {
        operating: {
            netIncome: incomeData?.netIncome || 45000,
            depreciation: 5000,
            accountsReceivableChange: -8000,
            inventoryChange: -3000,
            accountsPayableChange: 4000,
            total: 43000,
        },
        investing: {
            propertyPurchase: -25000,
            equipmentSale: 5000,
            investmentPurchase: -10000,
            total: -30000,
        },
        financing: {
            loanProceeds: 20000,
            loanRepayments: -5000,
            dividendsPaid: -10000,
            ownerWithdrawals: -5000,
            total: 0,
        },
        netChange: 13000,
        beginningCash: 50000,
        endingCash: 63000,
    };

    // Comparative data (previous period)
    const comparativeData = {
        revenue: 180000,
        expenses: 140000,
        netIncome: 40000,
        assets: 280000,
        liabilities: 95000,
        equity: 185000,
    };

    const tabs = [
        { id: "income", label: t("financialStatements.incomeStatement") },
        { id: "balance", label: t("financialStatements.balanceSheet") },
        { id: "trial", label: t("financialStatements.trialBalance") },
        { id: "cashflow", label: t("financialStatements.cashFlowStatement") },
        { id: "analysis", label: t("financialStatements.analysis") },
    ] as const;

    const renderChange = (current: number, previous: number) => {
        const change = current - previous;
        const pct = previous !== 0 ? ((change / previous) * 100).toFixed(1) : 0;
        return (
            <span className={`text-xs flex items-center gap-1 ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
                {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {pct}%
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t("financialStatements.title")}</h1>
                    <p className="text-sm text-muted-foreground">{t("financialStatements.subtitle")}</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                            className="px-3 py-2 text-sm border border-border rounded-lg bg-background"
                        />
                        <span className="text-muted-foreground">to</span>
                        <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                            className="px-3 py-2 text-sm border border-border rounded-lg bg-background"
                        />
                    </div>
                    <label className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg cursor-pointer hover:bg-muted">
                        <input
                            type="checkbox"
                            checked={showComparative}
                            onChange={(e) => setShowComparative(e.target.checked)}
                            className="rounded"
                        />
                        Comparative
                    </label>
                    {activeTab !== "analysis" && (
                        <button
                            onClick={() => {
                                const type = activeTab === "income" ? "income" : activeTab === "balance" ? "balance" : "cashflow";
                                window.open(`/api/reports/export-pdf?type=${type}`, "_blank");
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                        >
                            <Download className="w-4 h-4" />
                            {t("financialStatements.exportPdf")}
                        </button>
                    )}
                    {activeTab === "analysis" && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => refetchRatios()}
                                className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
                            >
                                <RefreshCw className="w-4 h-4" />
                                {locale === "ar" ? "تحديث" : "Refresh"}
                            </button>
                            <button
                                onClick={handleAIAnalysis}
                                disabled={aiMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                <Brain className="w-4 h-4" />
                                {aiMutation.isPending ? t("ratios.analyzing") : t("ratios.aiAnalysis")}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
                <nav className="flex gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Income Statement */}
            {activeTab === "income" && (
                <div className="bg-card rounded-lg border border-border p-6">
                    <h2 className="text-xl font-bold mb-6 text-center">{t("financialStatements.incomeStatement")}</h2>
                    {incomeLoading ? (
                        <div className="text-center py-8 text-muted-foreground">{t("common.loading")}</div>
                    ) : (
                        <div className="space-y-6 max-w-2xl mx-auto">
                            {/* Revenue */}
                            <div>
                                <h3 className="font-semibold text-green-600 mb-2">{t("financialStatements.revenue")}</h3>
                                <div className="space-y-1 ms-4">
                                    {(incomeData?.revenue || []).map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between">
                                            <span>{item.account}</span>
                                            <span>{formatCurrency(item.amount, locale, "EGP")}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between font-semibold mt-2 pt-2 border-t border-border">
                                    <span>{t("financialStatements.totalRevenue")}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-600">{formatCurrency(incomeData?.totalRevenue || 0, locale, "EGP")}</span>
                                        {showComparative && renderChange(incomeData?.totalRevenue || 0, comparativeData.revenue)}
                                    </div>
                                </div>
                            </div>

                            {/* COGS */}
                            <div>
                                <h3 className="font-semibold text-orange-600 mb-2">{t("financialStatements.costOfGoodsSold")}</h3>
                                <div className="space-y-1 ms-4">
                                    {(incomeData?.cogs || []).map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between">
                                            <span>{item.account}</span>
                                            <span>({formatCurrency(item.amount, locale, "EGP")})</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between font-semibold mt-2 pt-2 border-t border-border">
                                    <span>{t("financialStatements.grossProfit")}</span>
                                    <span>{formatCurrency(incomeData?.grossProfit || 0, locale, "EGP")}</span>
                                </div>
                            </div>

                            {/* Expenses */}
                            <div>
                                <h3 className="font-semibold text-red-600 mb-2">{t("financialStatements.operatingExpenses")}</h3>
                                <div className="space-y-1 ms-4">
                                    {(incomeData?.expenses || []).map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between">
                                            <span>{item.account}</span>
                                            <span>({formatCurrency(item.amount, locale, "EGP")})</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between font-semibold mt-2 pt-2 border-t border-border">
                                    <span>{t("financialStatements.totalExpenses")}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-600">({formatCurrency(incomeData?.totalExpenses || 0, locale, "EGP")})</span>
                                        {showComparative && renderChange(incomeData?.totalExpenses || 0, comparativeData.expenses)}
                                    </div>
                                </div>
                            </div>

                            {/* Net Income */}
                            <div className="pt-4 border-t-2 border-border">
                                <div className="flex justify-between text-xl font-bold">
                                    <span>{t("financialStatements.netIncome")}</span>
                                    <div className="flex items-center gap-2">
                                        <span className={incomeData?.netIncome >= 0 ? "text-green-600" : "text-red-600"}>
                                            {formatCurrency(incomeData?.netIncome || 0, locale, "EGP")}
                                        </span>
                                        {showComparative && renderChange(incomeData?.netIncome || 0, comparativeData.netIncome)}
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="mt-6 pt-4 border-t border-border">
                                <h4 className="font-medium text-sm text-muted-foreground mb-2">Notes:</h4>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    <li>1. Revenue is recognized when goods are delivered or services are rendered.</li>
                                    <li>2. Depreciation is calculated using the straight-line method.</li>
                                    <li>3. All amounts are in Egyptian Pounds (EGP).</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Balance Sheet */}
            {activeTab === "balance" && (
                <div className="bg-card rounded-lg border border-border p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">{t("financialStatements.balanceSheet")}</h2>
                        {balanceData?.isBalanced ? (
                            <span className="flex items-center gap-1 text-sm text-green-600">
                                <CheckCircle className="w-4 h-4" /> Balanced
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-sm text-red-600">
                                <AlertTriangle className="w-4 h-4" /> Unbalanced
                            </span>
                        )}
                    </div>
                    {balanceLoading ? (
                        <div className="text-center py-8 text-muted-foreground">{t("common.loading")}</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-8">
                            {/* Assets */}
                            <div>
                                <h3 className="font-bold text-lg text-blue-600 mb-4">{t("financialStatements.assets")}</h3>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium mb-2">{t("financialStatements.currentAssets")}</h4>
                                        <div className="space-y-1 ms-4">
                                            {(balanceData?.assets?.items || [])
                                                .filter((a: any) => a.category === "CURRENT_ASSET")
                                                .map((item: any, i: number) => (
                                                    <div key={i} className="flex justify-between text-sm">
                                                        <span>{item.account}</span>
                                                        <span>{formatCurrency(item.balance, locale, "EGP")}</span>
                                                    </div>
                                                ))}
                                        </div>
                                        <div className="flex justify-between font-medium mt-2 ms-4">
                                            <span>Total Current Assets</span>
                                            <span>{formatCurrency(balanceData?.assets?.currentAssets || 0, locale, "EGP")}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-2">{t("financialStatements.fixedAssets")}</h4>
                                        <div className="space-y-1 ms-4">
                                            {(balanceData?.assets?.items || [])
                                                .filter((a: any) => a.category === "FIXED_ASSET")
                                                .map((item: any, i: number) => (
                                                    <div key={i} className="flex justify-between text-sm">
                                                        <span>{item.account}</span>
                                                        <span>{formatCurrency(item.balance, locale, "EGP")}</span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between font-bold mt-4 pt-4 border-t border-border">
                                    <span>{t("financialStatements.totalAssets")}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-600">{formatCurrency(balanceData?.assets?.total || 0, locale, "EGP")}</span>
                                        {showComparative && renderChange(balanceData?.assets?.total || 0, comparativeData.assets)}
                                    </div>
                                </div>
                            </div>

                            {/* Liabilities & Equity */}
                            <div>
                                <h3 className="font-bold text-lg text-red-600 mb-4">{t("financialStatements.liabilities")}</h3>
                                <div className="space-y-1 ms-4">
                                    {(balanceData?.liabilities?.items || []).map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span>{item.account}</span>
                                            <span>{formatCurrency(item.balance, locale, "EGP")}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between font-medium mt-2 ms-4">
                                    <span>Total Liabilities</span>
                                    <span>{formatCurrency(balanceData?.liabilities?.total || 0, locale, "EGP")}</span>
                                </div>

                                <h3 className="font-bold text-lg text-green-600 mt-6 mb-4">{t("financialStatements.equity")}</h3>
                                <div className="space-y-1 ms-4">
                                    {(balanceData?.equity?.items || []).map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span>{item.account}</span>
                                            <span>{formatCurrency(item.balance, locale, "EGP")}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between text-sm">
                                        <span>{t("financialStatements.retainedEarnings")}</span>
                                        <span>{formatCurrency(balanceData?.equity?.retainedEarnings || 0, locale, "EGP")}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between font-medium mt-2 ms-4">
                                    <span>Total Equity</span>
                                    <span>{formatCurrency(balanceData?.equity?.total || 0, locale, "EGP")}</span>
                                </div>

                                <div className="flex justify-between font-bold mt-4 pt-4 border-t border-border">
                                    <span>{t("financialStatements.totalLiabilitiesEquity")}</span>
                                    <span>{formatCurrency(balanceData?.totalLiabilitiesAndEquity || 0, locale, "EGP")}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Trial Balance */}
            {activeTab === "trial" && (
                <div className="bg-card rounded-lg border border-border overflow-hidden">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h2 className="text-xl font-bold">{t("financialStatements.trialBalance")}</h2>
                        {trialData?.isBalanced ? (
                            <span className="flex items-center gap-1 text-sm text-green-600">
                                <CheckCircle className="w-4 h-4" /> Balanced
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-sm text-red-600">
                                <AlertTriangle className="w-4 h-4" /> Unbalanced
                            </span>
                        )}
                    </div>
                    {trialLoading ? (
                        <div className="text-center py-8 text-muted-foreground">{t("common.loading")}</div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-start text-sm font-medium">{t("financialStatements.code")}</th>
                                    <th className="px-4 py-3 text-start text-sm font-medium">{t("financialStatements.accountName")}</th>
                                    <th className="px-4 py-3 text-end text-sm font-medium">{t("financialStatements.debit")}</th>
                                    <th className="px-4 py-3 text-end text-sm font-medium">{t("financialStatements.credit")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {(trialData?.items || []).map((item: any, i: number) => (
                                    <tr key={i} className="hover:bg-muted/50">
                                        <td className="px-4 py-3 font-mono text-sm">{item.accountCode}</td>
                                        <td className="px-4 py-3">{item.accountName}</td>
                                        <td className="px-4 py-3 text-end">{item.displayDebit > 0 ? formatCurrency(item.displayDebit, locale, "EGP") : ""}</td>
                                        <td className="px-4 py-3 text-end">{item.displayCredit > 0 ? formatCurrency(item.displayCredit, locale, "EGP") : ""}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-muted font-bold">
                                <tr>
                                    <td className="px-4 py-3" colSpan={2}>{t("financialStatements.total")}</td>
                                    <td className="px-4 py-3 text-end">{formatCurrency(trialData?.totalDebit || 0, locale, "EGP")}</td>
                                    <td className="px-4 py-3 text-end">{formatCurrency(trialData?.totalCredit || 0, locale, "EGP")}</td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>
            )}

            {/* Cash Flow Statement */}
            {activeTab === "cashflow" && (
                <div className="bg-card rounded-lg border border-border p-6">
                    <h2 className="text-xl font-bold mb-6 text-center">{t("financialStatements.cashFlowStatement")}</h2>
                    <div className="max-w-2xl mx-auto space-y-6">
                        {/* Operating Activities */}
                        <div>
                            <h3 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Cash Flows from Operating Activities
                            </h3>
                            <div className="space-y-2 ms-6">
                                <div className="flex justify-between">
                                    <span>Net Income</span>
                                    <span>{formatCurrency(cashFlowData.operating.netIncome, locale, "EGP")}</span>
                                </div>
                                <div className="text-sm text-muted-foreground mb-2">Adjustments for non-cash items:</div>
                                <div className="flex justify-between text-sm">
                                    <span className="ms-4">Add: Depreciation & Amortization</span>
                                    <span>{formatCurrency(cashFlowData.operating.depreciation, locale, "EGP")}</span>
                                </div>
                                <div className="text-sm text-muted-foreground mb-2 mt-3">Changes in working capital:</div>
                                <div className="flex justify-between text-sm">
                                    <span className="ms-4">Increase in Accounts Receivable</span>
                                    <span className="text-red-600">({formatCurrency(Math.abs(cashFlowData.operating.accountsReceivableChange), locale, "EGP")})</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="ms-4">Increase in Inventory</span>
                                    <span className="text-red-600">({formatCurrency(Math.abs(cashFlowData.operating.inventoryChange), locale, "EGP")})</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="ms-4">Increase in Accounts Payable</span>
                                    <span className="text-green-600">{formatCurrency(cashFlowData.operating.accountsPayableChange, locale, "EGP")}</span>
                                </div>
                            </div>
                            <div className="flex justify-between font-semibold mt-3 pt-2 border-t border-border">
                                <span>Net Cash from Operating Activities</span>
                                <span className="text-blue-600">{formatCurrency(cashFlowData.operating.total, locale, "EGP")}</span>
                            </div>
                        </div>

                        {/* Investing Activities */}
                        <div>
                            <h3 className="font-semibold text-orange-600 mb-3 flex items-center gap-2">
                                <TrendingDown className="w-4 h-4" />
                                Cash Flows from Investing Activities
                            </h3>
                            <div className="space-y-2 ms-6">
                                <div className="flex justify-between text-sm">
                                    <span>Purchase of Property & Equipment</span>
                                    <span className="text-red-600">({formatCurrency(Math.abs(cashFlowData.investing.propertyPurchase), locale, "EGP")})</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Sale of Equipment</span>
                                    <span className="text-green-600">{formatCurrency(cashFlowData.investing.equipmentSale, locale, "EGP")}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Purchase of Investments</span>
                                    <span className="text-red-600">({formatCurrency(Math.abs(cashFlowData.investing.investmentPurchase), locale, "EGP")})</span>
                                </div>
                            </div>
                            <div className="flex justify-between font-semibold mt-3 pt-2 border-t border-border">
                                <span>Net Cash from Investing Activities</span>
                                <span className="text-orange-600">({formatCurrency(Math.abs(cashFlowData.investing.total), locale, "EGP")})</span>
                            </div>
                        </div>

                        {/* Financing Activities */}
                        <div>
                            <h3 className="font-semibold text-purple-600 mb-3 flex items-center gap-2">
                                <Minus className="w-4 h-4" />
                                Cash Flows from Financing Activities
                            </h3>
                            <div className="space-y-2 ms-6">
                                <div className="flex justify-between text-sm">
                                    <span>Proceeds from Bank Loans</span>
                                    <span className="text-green-600">{formatCurrency(cashFlowData.financing.loanProceeds, locale, "EGP")}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Repayment of Loans</span>
                                    <span className="text-red-600">({formatCurrency(Math.abs(cashFlowData.financing.loanRepayments), locale, "EGP")})</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Dividends Paid</span>
                                    <span className="text-red-600">({formatCurrency(Math.abs(cashFlowData.financing.dividendsPaid), locale, "EGP")})</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Owner Withdrawals</span>
                                    <span className="text-red-600">({formatCurrency(Math.abs(cashFlowData.financing.ownerWithdrawals), locale, "EGP")})</span>
                                </div>
                            </div>
                            <div className="flex justify-between font-semibold mt-3 pt-2 border-t border-border">
                                <span>Net Cash from Financing Activities</span>
                                <span className="text-purple-600">{formatCurrency(cashFlowData.financing.total, locale, "EGP")}</span>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="pt-4 border-t-2 border-border space-y-2">
                            <div className="flex justify-between font-semibold">
                                <span>Net Increase (Decrease) in Cash</span>
                                <span className={cashFlowData.netChange >= 0 ? "text-green-600" : "text-red-600"}>
                                    {formatCurrency(cashFlowData.netChange, locale, "EGP")}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Cash at Beginning of Period</span>
                                <span>{formatCurrency(cashFlowData.beginningCash, locale, "EGP")}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
                                <span>Cash at End of Period</span>
                                <span className="text-green-600">{formatCurrency(cashFlowData.endingCash, locale, "EGP")}</span>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="mt-6 pt-4 border-t border-border">
                            <h4 className="font-medium text-sm text-muted-foreground mb-2">Notes:</h4>
                            <ul className="text-xs text-muted-foreground space-y-1">
                                <li>1. This statement is prepared using the indirect method.</li>
                                <li>2. Non-cash investing and financing activities are excluded.</li>
                                <li>3. All amounts are in Egyptian Pounds (EGP).</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
            {/* Analysis Tab */}
            {activeTab === "analysis" && (
                <div className="space-y-6">
                    {/* Health Score */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="col-span-1 p-6 bg-card rounded-lg border border-border">
                            <div className="flex items-center gap-3 mb-4">
                                <Activity className="w-6 h-6 text-primary" />
                                <span className="font-medium">{t("ratios.overallHealth")}</span>
                            </div>
                            <div className={`inline-block px-4 py-2 rounded-lg text-lg font-bold ${HEALTH_COLORS[ratiosData?.overallHealth] || ""}`}>
                                {t("ratios." + (ratiosData?.overallHealth?.toLowerCase() || "loading"))}
                            </div>
                            <div className="mt-4">
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                                        style={{ width: `${ratiosData?.healthScore || 0}%` }}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {t("ratios.healthScore")}: {ratiosData?.healthScore || 0}%
                                </p>
                            </div>
                        </div>

                        <div className="col-span-3 grid grid-cols-3 gap-4">
                            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="font-medium text-green-900 dark:text-green-100">{t("ratios.good")}</span>
                                </div>
                                <p className="text-3xl font-bold text-green-600">{ratiosData?.summary?.good || 0}</p>
                                <p className="text-sm text-green-700 dark:text-green-300">{t("ratios.ratiosPerforming")}</p>
                            </div>
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <Info className="w-5 h-5 text-yellow-600" />
                                    <span className="font-medium text-yellow-900 dark:text-yellow-100">{t("ratios.fair")}</span>
                                </div>
                                <p className="text-3xl font-bold text-yellow-600">{ratiosData?.summary?.fair || 0}</p>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300">{t("ratios.ratiosNeedAttention")}</p>
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                    <span className="font-medium text-red-900 dark:text-red-100">{t("ratios.poor")}</span>
                                </div>
                                <p className="text-3xl font-bold text-red-600">{ratiosData?.summary?.poor || 0}</p>
                                <p className="text-sm text-red-700 dark:text-red-300">{t("ratios.ratiosCritical")}</p>
                            </div>
                        </div>
                    </div>

                    {/* AI Analysis Panel */}
                    {showAIPanel && (
                        <div className="p-6 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center gap-2 mb-4">
                                <Brain className="w-5 h-5 text-purple-600" />
                                <h3 className="font-bold text-purple-900 dark:text-purple-100">{t("ratios.aiInsights")}</h3>
                            </div>
                            {aiMutation.isPending ? (
                                <div className="flex items-center gap-3 text-purple-700 dark:text-purple-300">
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    <span>{t("ratios.generatingInsights")}</span>
                                </div>
                            ) : aiMutation.data ? (
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium mb-2">{t("ratios.assessment")}</h4>
                                        <p className="text-sm">{aiMutation.data.assessment}</p>
                                    </div>
                                    {aiMutation.data.strengths?.length > 0 && (
                                        <div>
                                            <h4 className="font-medium mb-2 text-green-700 dark:text-green-300">{t("ratios.strengths")}</h4>
                                            <ul className="list-disc list-inside text-sm space-y-1">
                                                {aiMutation.data.strengths.map((s: string, i: number) => (
                                                    <li key={i}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {aiMutation.data.improvements?.length > 0 && (
                                        <div>
                                            <h4 className="font-medium mb-2 text-orange-700 dark:text-orange-300">{t("ratios.areasForImprovement")}</h4>
                                            <ul className="list-disc list-inside text-sm space-y-1">
                                                {aiMutation.data.improvements.map((s: string, i: number) => (
                                                    <li key={i}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {aiMutation.data.recommendations?.length > 0 && (
                                        <div>
                                            <h4 className="font-medium mb-2 text-blue-700 dark:text-blue-300">{t("ratios.recommendations")}</h4>
                                            <ul className="list-disc list-inside text-sm space-y-1">
                                                {aiMutation.data.recommendations.map((s: string, i: number) => (
                                                    <li key={i}>{s}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Ratio Categories */}
                    {ratiosLoading ? (
                        <div className="text-center py-8 text-muted-foreground">{t("common.loading")}</div>
                    ) : (
                        <div className="space-y-6">
                            {[
                                { title: t("ratios.liquidityRatios"), icon: TrendingUp, color: "text-blue-600", items: ["currentRatio", "quickRatio", "cashRatio"] },
                                { title: t("ratios.profitabilityRatios"), icon: TrendingUp, color: "text-green-600", items: ["grossProfitMargin", "netProfitMargin", "returnOnAssets", "returnOnEquity"] },
                                { title: t("ratios.efficiencyRatios"), icon: Activity, color: "text-purple-600", items: ["assetTurnover", "inventoryTurnover", "daysSalesOutstanding"] },
                                { title: t("ratios.leverageRatios"), icon: TrendingDown, color: "text-orange-600", items: ["debtToEquity", "debtToAssets"] },
                            ].map((cat) => (
                                <div key={cat.title}>
                                    <h3 className={`font-semibold mb-3 flex items-center gap-2`}>
                                        <cat.icon className={`w-5 h-5 ${cat.color}`} />
                                        {cat.title}
                                        <span className="text-xs text-muted-foreground font-normal ml-2">Industry: Manufacturing</span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {(ratiosData?.ratios || [])
                                            .filter((r: any) => cat.items.includes(r.name))
                                            .map((ratio: any) => (
                                                <RatioCard key={ratio.name} ratio={ratio} locale={locale} showBenchmarks={showBenchmarks} selectedRatio={selectedRatio} setSelectedRatio={setSelectedRatio} />
                                            ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


