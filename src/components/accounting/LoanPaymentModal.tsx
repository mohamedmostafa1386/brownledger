"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, Calendar, FileText, Loader2, CreditCard } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n-context";
import { formatCurrency, formatDate } from "@/lib/utils";

interface LoanPaymentModalProps {
    loanId: string;
    onClose: () => void;
}

export function LoanPaymentModal({ loanId, onClose }: LoanPaymentModalProps) {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);

    // Fetch loan details to show current balance and recommendation
    const { data: loan, isLoading } = useQuery<any>({
        queryKey: ["loan-details", loanId],
        queryFn: async () => {
            const res = await fetch(`/api/loans?id=${loanId}`);
            if (!res.ok) throw new Error("Failed to fetch loan details");
            return res.json();
        },
        enabled: !!loanId,
    });

    const [formData, setFormData] = useState({
        amount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        notes: "",
    });

    // Auto-fill recommended payment when loan data loaded
    useState(() => {
        if (loan?.monthlyPayment) {
            setFormData(prev => ({ ...prev, amount: loan.monthlyPayment.toString() }));
        }
    });

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/loans?action=payment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    loanId,
                    ...data,
                    amount: parseFloat(data.amount),
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to record payment");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["loans"] });
            queryClient.invalidateQueries({ queryKey: ["loan-details", loanId] });
            onClose();
        },
        onError: (err: Error) => {
            setError(err.message);
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.amount || !formData.paymentDate) {
            setError("Please fill in all required fields");
            return;
        }

        mutation.mutate(formData);
    };

    if (!loanId) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-card w-full max-w-lg rounded-xl shadow-2xl border border-border overflow-hidden"
                >
                    <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <CreditCard className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{t("loans.repay")}</h2>
                                <p className="text-sm text-muted-foreground">{loan?.loanName}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Loan Summary Snippet */}
                        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Remaining Balance:</span>
                                <span className="font-bold text-destructive">{formatCurrency(loan?.remainingBalance || 0)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Recommended Payment:</span>
                                <span className="font-medium text-primary cursor-pointer hover:underline" onClick={() => setFormData({ ...formData, amount: loan?.monthlyPayment?.toString() || "" })}>
                                    {formatCurrency(loan?.monthlyPayment || 0)}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    Payment Amount*
                                </label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full h-11 rounded-lg border border-input bg-background px-4 text-lg font-semibold focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    Payment Date*
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.paymentDate}
                                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    Notes
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="e.g., Early repayment, Partial payment..."
                                    className="w-full rounded-lg border border-input bg-background p-3 text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                                />
                            </div>
                        </div>
                    </form>

                    <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={mutation.isPending || isLoading}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20"
                        >
                            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            Record Payment
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
