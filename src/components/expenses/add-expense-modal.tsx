"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { X, Sparkles, Camera, Loader2 } from "lucide-react";

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: {
        vendor?: string;
        date?: string;
        amount?: number;
        description?: string;
        categoryId?: string;
    };
}

export function AddExpenseModal({ isOpen, onClose, initialData }: AddExpenseModalProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        vendor: initialData?.vendor || "",
        date: initialData?.date || new Date().toISOString().split("T")[0],
        amount: initialData?.amount || 0,
        description: initialData?.description || "",
        category: initialData?.categoryId || "",
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const response = await fetch("/api/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    vendor: data.vendor,
                    date: data.date,
                    amount: data.amount,
                    description: data.description,
                    categoryId: data.category || null,
                }),
            });
            if (!response.ok) throw new Error("Failed to create expense");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["expenses"] });
            onClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full mx-4"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h3 className="font-semibold">Add Expense</h3>
                    <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Vendor</label>
                        <input
                            type="text"
                            value={formData.vendor}
                            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                            placeholder="e.g., Amazon, Office Depot"
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium">Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="What was this expense for?"
                            rows={3}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="">Select category...</option>
                            <option value="office">Office Supplies</option>
                            <option value="software">Software</option>
                            <option value="travel">Travel</option>
                            <option value="marketing">Marketing</option>
                            <option value="utilities">Utilities</option>
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-10 rounded-lg border border-input font-medium hover:bg-muted"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="flex-1 h-10 rounded-lg bg-primary font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {createMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                            ) : (
                                "Add Expense"
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
