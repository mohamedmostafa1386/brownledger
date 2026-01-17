"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Circle, Calendar, Clock, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n-context";
import { formatCurrency, formatDate } from "@/lib/utils";

interface LoanScheduleProps {
    loanId: string;
    onClose: () => void;
}

interface ScheduleEntry {
    periodNumber: number;
    dueDate: string;
    principalDue: number;
    interestDue: number;
    totalDue: number;
    balanceAfter: number;
    isPaid: boolean;
}

export function LoanSchedule({ loanId, onClose }: LoanScheduleProps) {
    const { t } = useI18n();

    const { data: loan, isLoading } = useQuery<any>({
        queryKey: ["loan-details", loanId],
        queryFn: async () => {
            const res = await fetch(`/api/loans?id=${loanId}`);
            if (!res.ok) throw new Error("Failed to fetch loan details");
            return res.json();
        },
        enabled: !!loanId,
    });

    const schedule: ScheduleEntry[] = loan?.schedule || [];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: 20 }}
                    className="bg-card w-full max-w-3xl rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[85vh]"
                >
                    <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{t("loans.schedule")}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {loan?.loanName} - {loan?.lenderName}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-background border-b border-border text-muted-foreground z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium">#</th>
                                    <th className="px-6 py-3 text-left font-medium">Due Date</th>
                                    <th className="px-6 py-3 text-right font-medium">Principal</th>
                                    <th className="px-6 py-3 text-right font-medium">Interest</th>
                                    <th className="px-6 py-3 text-right font-medium">Total Due</th>
                                    <th className="px-6 py-3 text-right font-medium">Balance</th>
                                    <th className="px-6 py-3 text-center font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={7} className="px-6 py-4 h-12 bg-muted/10" />
                                        </tr>
                                    ))
                                ) : schedule.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground italic">
                                            No schedule created yet.
                                        </td>
                                    </tr>
                                ) : (
                                    schedule.map((entry) => (
                                        <tr key={entry.periodNumber} className={`hover:bg-muted/30 transition-colors ${entry.isPaid ? "bg-green-50/30 text-muted-foreground" : ""}`}>
                                            <td className="px-6 py-4 font-medium">
                                                {entry.periodNumber}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {formatDate(entry.dueDate)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {formatCurrency(entry.principalDue)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {formatCurrency(entry.interestDue)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-destructive">
                                                {formatCurrency(entry.totalDue)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {formatCurrency(entry.balanceAfter)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    {entry.isPaid ? (
                                                        <div className="flex items-center gap-1.5 text-green-600 font-medium">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            <span>Paid</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-amber-500">
                                                            <Clock className="h-4 w-4" />
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
                        <div className="flex gap-8">
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">Original Principal</span>
                                <span className="font-bold">{formatCurrency(loan?.principalAmount || 0)}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground">Est. Total Interest</span>
                                <span className="font-bold">{formatCurrency(loan?.totalInterest || 0)}</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors"
                        >
                            {t("common.close")}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
