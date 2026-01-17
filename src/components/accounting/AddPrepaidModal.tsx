"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, DollarSign, FileText, User, Hash, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n-context";

interface AddPrepaidModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Account {
    id: string;
    accountCode: string;
    accountName: string;
    accountType: string;
}

export function AddPrepaidModal({ isOpen, onClose }: AddPrepaidModalProps) {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        description: "",
        vendorName: "",
        referenceNumber: "",
        totalAmount: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
        expenseAccountId: "",
        assetAccountId: "",
        notes: "",
    });

    // Fetch accounts for asset and expense selection
    const { data: accounts = [] } = useQuery<Account[]>({
        queryKey: ["accounts"],
        queryFn: async () => {
            const res = await fetch("/api/accounts");
            if (!res.ok) throw new Error("Failed to fetch accounts");
            return res.json();
        },
    });

    const assetAccounts = accounts.filter(a => a.accountType === "ASSET");
    const expenseAccounts = accounts.filter(a => a.accountType === "EXPENSE");

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch("/api/prepaid-expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to create prepaid asset");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["prepaid-expenses"] });
            onClose();
        },
        onError: (err: Error) => {
            setError(err.message);
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.description || !formData.totalAmount || !formData.startDate || !formData.endDate) {
            setError("Please fill in all required fields");
            return;
        }

        mutation.mutate({
            ...formData,
            totalAmount: parseFloat(formData.totalAmount),
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
                            <h2 className="text-xl font-bold">{t("prepaidExpenses.newAsset")}</h2>
                            <p className="text-sm text-muted-foreground">Record a new upfront payment to be recognized over time.</p>
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
                            {/* Description */}
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    {t("prepaidExpenses.description")}*
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Annual Insurance 2024"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>

                            {/* Vendor & Ref */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    {t("prepaidExpenses.vendor")}
                                </label>
                                <input
                                    type="text"
                                    placeholder="Supplier name"
                                    value={formData.vendorName}
                                    onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
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
                                    placeholder="Invoice or Bill #"
                                    value={formData.referenceNumber}
                                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>

                            {/* Amount & Dates */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    {t("prepaidExpenses.totalAmount")}*
                                </label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.totalAmount}
                                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="md:col-start-1 space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {t("prepaidExpenses.startDate")}*
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {t("prepaidExpenses.endDate")}*
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>

                            {/* Accounts */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t("prepaidExpenses.assetAccount")}</label>
                                <select
                                    value={formData.assetAccountId}
                                    onChange={(e) => setFormData({ ...formData, assetAccountId: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none"
                                >
                                    <option value="">Select Asset Account</option>
                                    {assetAccounts.map(a => (
                                        <option key={a.id} value={a.id}>({a.accountCode}) {a.accountName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t("prepaidExpenses.expenseAccount")}</label>
                                <select
                                    value={formData.expenseAccountId}
                                    onChange={(e) => setFormData({ ...formData, expenseAccountId: e.target.value })}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none"
                                >
                                    <option value="">Select Expense Account</option>
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
