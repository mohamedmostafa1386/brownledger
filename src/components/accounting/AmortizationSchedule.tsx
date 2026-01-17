"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Circle, Calendar, DollarSign, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n-context";
import { formatCurrency, formatDate } from "@/lib/utils";

interface AmortizationScheduleProps {
    assetId: string;
    onClose: () => void;
}

interface ScheduleEntry {
    periodNumber: number;
    periodDate: string;
    amount: number;
    cumulativeRecognized: number;
    remainingBalance: number;
    isProcessed: boolean;
}

export function AmortizationSchedule({ assetId, onClose }: AmortizationScheduleProps) {
    const { t } = useI18n();

    const { data: schedule = [], isLoading } = useQuery<ScheduleEntry[]>({
        queryKey: ["prepaid-schedule", assetId],
        queryFn: async () => {
            const res = await fetch(`/api/prepaid-expenses?id=${assetId}`);
            if (!res.ok) throw new Error("Failed to fetch schedule");
            const data = await res.json();
            return data.schedule;
        },
        enabled: !!assetId,
    });

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: 20 }}
                    className="bg-card w-full max-w-2xl rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[85vh]"
                >
                    <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{t("prepaidExpenses.schedule")}</h2>
                                <p className="text-sm text-muted-foreground">Detailed breakdown of recognition periods.</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-0">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-background border-b border-border text-muted-foreground z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium">#</th>
                                    <th className="px-6 py-3 text-left font-medium">{t("prepaidExpenses.periodDate")}</th>
                                    <th className="px-6 py-3 text-right font-medium">{t("common.amount")}</th>
                                    <th className="px-6 py-3 text-right font-medium">{t("prepaidExpenses.recognized")}</th>
                                    <th className="px-6 py-3 text-right font-medium">{t("prepaidExpenses.remaining")}</th>
                                    <th className="px-6 py-3 text-center font-medium">{t("common.status")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={6} className="px-6 py-4 h-12 bg-muted/10" />
                                        </tr>
                                    ))
                                ) : schedule.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                                            No schedule entries found.
                                        </td>
                                    </tr>
                                ) : (
                                    schedule.map((entry) => (
                                        <tr key={entry.periodNumber} className={`hover:bg-muted/30 transition-colors ${entry.isProcessed ? "bg-green-50/30" : ""}`}>
                                            <td className="px-6 py-4 font-medium text-muted-foreground">
                                                {entry.periodNumber}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {formatDate(entry.periodDate)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium">
                                                {formatCurrency(entry.amount)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-muted-foreground">
                                                {formatCurrency(entry.cumulativeRecognized)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-muted-foreground">
                                                {formatCurrency(entry.remainingBalance)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    {entry.isProcessed ? (
                                                        <div className="flex items-center gap-1.5 text-green-600 font-medium">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            <span>Recognized</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-amber-500">
                                                            <Circle className="h-4 w-4" />
                                                            <span>Pending</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 border-t border-border bg-muted/30 flex justify-between items-center text-sm">
                        <div className="flex gap-6">
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">Total to Recognize</span>
                                <span className="font-bold">{formatCurrency(schedule[schedule.length - 1]?.cumulativeRecognized || 0)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">Processed Periods</span>
                                <span className="font-bold">{schedule.filter(s => s.isProcessed).length} / {schedule.length}</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors"
                        >
                            {t("common.close")}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
