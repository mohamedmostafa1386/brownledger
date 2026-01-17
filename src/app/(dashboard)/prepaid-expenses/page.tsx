"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Plus,
    Search,
    Calendar,
    Clock,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    MoreHorizontal,
    FileText,
    TrendingUp,
    RefreshCw
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import { AddPrepaidModal } from "@/components/accounting/AddPrepaidModal";
import { AmortizationSchedule } from "@/components/accounting/AmortizationSchedule";

interface PrepaidExpense {
    id: string;
    description: string;
    vendorName: string | null;
    totalAmount: number;
    startDate: string;
    endDate: string;
    periodMonths: number;
    monthlyAmount: number;
    recognizedAmount: number;
    remainingAmount: number;
    isActive: boolean;
    lastRecognizedAt: string | null;
}

const fetchPrepaidExpenses = async () => {
    const res = await fetch("/api/prepaid-expenses");
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
};

export default function PrepaidExpensesPage() {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["prepaid-expenses"],
        queryFn: fetchPrepaidExpenses,
    });

    const processMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/prepaid-expenses?action=process-pending", {
                method: "POST",
            });
            if (!res.ok) throw new Error("Failed to process recognition");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["prepaid-expenses"] });
            // Show success toast or notification? 
            // For now, simple refresh is enough
        },
    });

    const assets: PrepaidExpense[] = data?.prepaidExpenses || [];
    const pendingCount = data?.pendingCount || 0;
    const pendingTotal = data?.pendingTotal || 0;

    const filteredAssets = assets.filter((asset) =>
        asset.description.toLowerCase().includes(search.toLowerCase()) ||
        asset.vendorName?.toLowerCase().includes(search.toLowerCase())
    );

    const totalAssetsValue = assets.reduce((sum, a) => sum + a.totalAmount, 0);
    const totalRemaining = assets.reduce((sum, a) => sum + a.remainingAmount, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">{t("prepaidExpenses.title")}</h1>
                    <p className="text-muted-foreground">{t("prepaidExpenses.subtitle")}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => processMutation.mutate()}
                        disabled={pendingCount === 0 || processMutation.isPending}
                        className="flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${processMutation.isPending ? "animate-spin" : ""}`} />
                        {t("prepaidExpenses.processPending")}
                        {pendingCount > 0 && (
                            <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        {t("prepaidExpenses.newAsset")}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <p className="text-sm font-medium">Total Assets</p>
                    </div>
                    <p className="text-2xl font-semibold">{formatCurrency(totalAssetsValue)}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Clock className="h-4 w-4" />
                        <p className="text-sm font-medium">{t("prepaidExpenses.remaining")}</p>
                    </div>
                    <p className="text-2xl font-semibold text-primary">{formatCurrency(totalRemaining)}</p>
                </div>
                <div className="rounded-xl border border-border bg-amber-50 p-4">
                    <div className="flex items-center gap-2 text-amber-700 mb-1">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm font-medium">{t("prepaidExpenses.pendingRecognition")}</p>
                    </div>
                    <p className="text-2xl font-semibold text-amber-700">{formatCurrency(pendingTotal)}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <p className="text-sm font-medium">{t("prepaidExpenses.recognized")}</p>
                    </div>
                    <p className="text-2xl font-semibold text-green-600">
                        {formatCurrency(totalAssetsValue - totalRemaining)}
                    </p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder={t("common.search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 w-full max-w-md rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>

            {/* Assets Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium">{t("prepaidExpenses.description")}</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">{t("prepaidExpenses.vendor")}</th>
                            <th className="px-4 py-3 text-center text-sm font-medium">{t("prepaidExpenses.periods")}</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">{t("prepaidExpenses.monthly")}</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">{t("prepaidExpenses.remaining")}</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">{t("prepaidExpenses.totalAmount")}</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">{t("common.actions")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={7} className="px-4 py-4 h-12 bg-muted/20" />
                                </tr>
                            ))
                        ) : filteredAssets.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                    {t("prepaidExpenses.noAssets")}
                                </td>
                            </tr>
                        ) : (
                            filteredAssets.map((asset) => (
                                <tr key={asset.id} className="hover:bg-muted/50 group transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{asset.description}</span>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                <span>{formatDate(asset.startDate)}</span>
                                                <ArrowRight className="h-2 w-2 mx-1" />
                                                <span>{formatDate(asset.endDate)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm">
                                        {asset.vendorName || "-"}
                                    </td>
                                    <td className="px-4 py-4 text-center text-sm">
                                        {asset.periodMonths} {t("prepaidExpenses.periods")}
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm font-medium">
                                        {formatCurrency(asset.monthlyAmount)}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-medium text-primary">
                                                {formatCurrency(asset.remainingAmount)}
                                            </span>
                                            <div className="w-20 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-primary"
                                                    style={{ width: `${(asset.remainingAmount / asset.totalAmount) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm">
                                        {formatCurrency(asset.totalAmount)}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedAssetId(asset.id)}
                                                className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors"
                                                title={t("prepaidExpenses.schedule")}
                                            >
                                                <FileText className="h-4 w-4" />
                                            </button>
                                            <button className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {showAddModal && (
                <AddPrepaidModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                />
            )}

            {selectedAssetId && (
                <AmortizationSchedule
                    assetId={selectedAssetId}
                    onClose={() => setSelectedAssetId(null)}
                />
            )}
        </div>
    );
}
