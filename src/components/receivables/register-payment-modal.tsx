"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n-context";
import { formatCurrency } from "@/lib/utils";
import { X, DollarSign, FileCheck, Building2 } from "lucide-react";

interface RegisterPaymentModalProps {
    method: "CASH" | "CHECK" | "BANK";
    onClose: () => void;
}

export function RegisterPaymentModal({ method, onClose }: RegisterPaymentModalProps) {
    const { t, locale } = useI18n();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        clientId: "",
        paymentDate: new Date().toISOString().split("T")[0],
        amount: "",
        receivedBy: "",
        checkNumber: "",
        checkDate: "",
        bankName: "",
        bankReference: "",
        receiverAccount: "",
        notes: "",
        autoApply: true,
    });

    // Get clients
    const { data: clients } = useQuery({
        queryKey: ["clients"],
        queryFn: () => fetch("/api/clients").then((r) => r.json()),
    });

    // Get selected client details
    const { data: clientDetails } = useQuery({
        queryKey: ["client-details", formData.clientId],
        queryFn: () => fetch(`/api/clients/${formData.clientId}`).then((r) => r.json()),
        enabled: !!formData.clientId,
    });

    const createPaymentMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await fetch("/api/receivables/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed to create payment");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            queryClient.invalidateQueries({ queryKey: ["receivables-stats"] });
            queryClient.invalidateQueries({ queryKey: ["unapplied-payments"] });
            onClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createPaymentMutation.mutate({
            clientId: formData.clientId,
            paymentDate: formData.paymentDate,
            amount: parseFloat(formData.amount),
            paymentMethod: method === "BANK" ? "BANK_TRANSFER" : method,
            receivedBy: formData.receivedBy,
            checkNumber: formData.checkNumber,
            checkDate: formData.checkDate,
            bankName: formData.bankName,
            bankReference: formData.bankReference,
            receiverAccount: formData.receiverAccount,
            notes: formData.notes,
            autoApply: formData.autoApply,
        });
    };

    const getMethodIcon = () => {
        switch (method) {
            case "CASH": return <DollarSign className="w-6 h-6 text-green-600" />;
            case "CHECK": return <FileCheck className="w-6 h-6 text-blue-600" />;
            case "BANK": return <Building2 className="w-6 h-6 text-purple-600" />;
        }
    };

    const getMethodColor = () => {
        switch (method) {
            case "CASH": return "bg-green-600 hover:bg-green-700";
            case "CHECK": return "bg-blue-600 hover:bg-blue-700";
            case "BANK": return "bg-purple-600 hover:bg-purple-700";
        }
    };

    const getMethodTitle = () => {
        switch (method) {
            case "CASH": return t("receivables.registerCash");
            case "CHECK": return t("receivables.registerCheck");
            case "BANK": return t("receivables.registerBankTransfer");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        {getMethodIcon()}
                        <h2 className="text-xl font-bold">{getMethodTitle()}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Client Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2">{t("receivables.client")} *</label>
                        <select
                            value={formData.clientId}
                            onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                            className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                            required
                        >
                            <option value="">Select client...</option>
                            {Array.isArray(clients) && clients.map((client: any) => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Client Info Display */}
                    {clientDetails && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg grid grid-cols-3 gap-4">
                            <div>
                                <div className="text-sm text-muted-foreground">Outstanding</div>
                                <div className="font-semibold">{formatCurrency(clientDetails.totalOutstanding || 0, locale, "EGP")}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Open Invoices</div>
                                <div className="font-semibold">{clientDetails.invoices?.length || 0}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Payment Terms</div>
                                <div className="font-semibold">{clientDetails.paymentTerms || 30} days</div>
                            </div>
                        </div>
                    )}

                    {/* Date & Amount */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">{t("receivables.date")} *</label>
                            <input
                                type="date"
                                value={formData.paymentDate}
                                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">{t("receivables.totalAmount")} *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                                required
                            />
                        </div>
                    </div>

                    {/* Method-Specific Fields */}
                    {method === "CASH" && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Received By</label>
                            <input
                                type="text"
                                placeholder="Staff name..."
                                value={formData.receivedBy}
                                onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                                className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                            />
                        </div>
                    )}

                    {method === "CHECK" && (
                        <>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Check Number *</label>
                                    <input
                                        type="text"
                                        placeholder="123456"
                                        value={formData.checkNumber}
                                        onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                                        className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Check Date *</label>
                                    <input
                                        type="date"
                                        value={formData.checkDate}
                                        onChange={(e) => setFormData({ ...formData, checkDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Bank Name</label>
                                    <input
                                        type="text"
                                        placeholder="Bank name..."
                                        value={formData.bankName}
                                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                        className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                                    />
                                </div>
                            </div>
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                    ⚠️ Check will be marked as RECEIVED. Update status when deposited/cleared.
                                </p>
                            </div>
                        </>
                    )}

                    {method === "BANK" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Bank Reference *</label>
                                <input
                                    type="text"
                                    placeholder="Transaction ID..."
                                    value={formData.bankReference}
                                    onChange={(e) => setFormData({ ...formData, bankReference: e.target.value })}
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Receiver Account</label>
                                <input
                                    type="text"
                                    placeholder="Account number..."
                                    value={formData.receiverAccount}
                                    onChange={(e) => setFormData({ ...formData, receiverAccount: e.target.value })}
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-background"
                                />
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Notes</label>
                        <textarea
                            placeholder="Additional notes..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-2 border border-border rounded-lg bg-background h-20"
                        />
                    </div>

                    {/* Auto Apply Option */}
                    <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.autoApply}
                                onChange={(e) => setFormData({ ...formData, autoApply: e.target.checked })}
                                className="w-5 h-5 rounded"
                            />
                            <div>
                                <div className="font-medium text-green-900 dark:text-green-100">
                                    Auto-apply to invoices
                                </div>
                                <div className="text-sm text-green-700 dark:text-green-300">
                                    System will match this payment to open invoices automatically (FIFO)
                                </div>
                            </div>
                        </label>
                    </div>

                    {/* Error Display */}
                    {createPaymentMutation.isError && (
                        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                            Failed to create payment. Please try again.
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={createPaymentMutation.isPending}
                            className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 ${getMethodColor()}`}
                        >
                            {createPaymentMutation.isPending ? "Saving..." : t("common.save")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
