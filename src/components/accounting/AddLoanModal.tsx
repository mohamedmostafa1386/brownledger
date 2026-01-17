"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, DollarSign, FileText, User, Hash, Loader2, Percent, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n-context";

interface AddLoanModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Account {
    id: string;
    accountCode: string;
    accountName: string;
    accountType: string;
}

export function AddLoanModal({ isOpen, onClose }: AddLoanModalProps) {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        loanName: "",
        lenderName: "",
        referenceNumber: "",
        principalAmount: "",
        interestRate: "",
        interestType: "COMPOUND",
        startDate: new Date().toISOString().split("T")[0],
        termMonths: "12",
        paymentFrequency: "MONTHLY",
        loanAccountId: "",
        interestAccountId: "",
        notes: "",
    });

    // Fetch accounts
    const { data: accounts = [] } = useQuery<Account[]>({
        queryKey: ["accounts"],
        queryFn: async () => {
            const res = await fetch("/api/accounts");
            if (!res.ok) throw new Error("Failed to fetch accounts");
            return res.json();
        },
    });

    const liabilityAccounts = accounts.filter(a => a.accountType === "LIABILITY");
    const expenseAccounts = accounts.filter(a => a.accountType === "EXPENSE");

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch("/api/loans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to create loan");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["loans"] });
            onClose();
        },
        onError: (err: Error) => {
            setError(err.message);
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.loanName || !formData.lenderName || !formData.principalAmount || !formData.interestRate) {
            setError("Please fill in all required fields");
            return;
        }

        mutation.mutate({
            ...formData,
            principalAmount: parseFloat(formData.principalAmount),
            interestRate: parseFloat(formData.interestRate) / 100, // Convert percentage to decimal
            termMonths: parseInt(formData.termMonths),
            startDate: new Date(formData.startDate),
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-card w-full max-w-2xl rounded-xl shadow-2xl border border-border overflow-hidden"
                >
                    <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                        <div>
                            <h2 className="text-xl font-bold">{t("loans.newLoan")}</h2>
                            <p className="text-sm text-muted-foreground">Setup a new loan or line of credit with automated amortization.</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        {error && (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Loan Name */}
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    {t("loans.title")}*
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., SME Expansion Loan"
                                    value={formData.loanName}
                                    onChange={(e) => setFormData({ ...formData, loanName: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>

                            {/* Lender & Ref */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    {t("loans.lender")}*
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Bank or Lender name"
                                    value={formData.lenderName}
                                    onChange={(e) => setFormData({ ...formData, lenderName: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                    Reference #
                                </label>
                                <input
                                    type="text"
                                    placeholder="Loan account number"
                                    value={formData.referenceNumber}
                                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>

                            {/* Principal & Interest */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    {t("loans.principal")}*
                                </label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.principalAmount}
                                    onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Percent className="h-4 w-4 text-muted-foreground" />
                                    {t("loans.interestRate")} (%)*
                                </label>
                                <input
                                    type="number"
                                    required
                                    step="0.1"
                                    placeholder="12.0"
                                    value={formData.interestRate}
                                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>

                            {/* Terms & Dates */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    {t("loans.termMonths")}*
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.termMonths}
                                    onChange={(e) => setFormData({ ...formData, termMonths: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {t("common.startDate")}*
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>

                            {/* Types */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Interest Type</label>
                                <select
                                    value={formData.interestType}
                                    onChange={(e) => setFormData({ ...formData, interestType: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none"
                                >
                                    <option value="SIMPLE">Simple Interest</option>
                                    <option value="COMPOUND">Compound (Amortized)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Payment Frequency</label>
                                <select
                                    value={formData.paymentFrequency}
                                    onChange={(e) => setFormData({ ...formData, paymentFrequency: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none"
                                >
                                    <option value="MONTHLY">Monthly</option>
                                    <option value="QUARTERLY">Quarterly</option>
                                    <option value="ANNUALLY">Annually</option>
                                </select>
                            </div>

                            {/* Accounts */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t("loans.loanAccount")}</label>
                                <select
                                    value={formData.loanAccountId}
                                    onChange={(e) => setFormData({ ...formData, loanAccountId: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none"
                                >
                                    <option value="">Select Liability Account</option>
                                    {liabilityAccounts.map(a => (
                                        <option key={a.id} value={a.id}>({a.accountCode}) {a.accountName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t("loans.interestAccount")}</label>
                                <select
                                    value={formData.interestAccountId}
                                    onChange={(e) => setFormData({ ...formData, interestAccountId: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none"
                                >
                                    <option value="">Select Interest Expense Account</option>
                                    {expenseAccounts.map(a => (
                                        <option key={a.id} value={a.id}>({a.accountCode}) {a.accountName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-medium">Notes</label>
                                <textarea
                                    rows={2}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                            disabled={mutation.isPending}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-lg shadow-primary/20"
                        >
                            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            {t("common.save")}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
