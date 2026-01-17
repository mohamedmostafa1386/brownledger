"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";

interface AddClientModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddClientModal({ isOpen, onClose }: AddClientModalProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        paymentTerms: 30,
    });

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const response = await fetch("/api/clients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed to create client");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            onClose();
            setFormData({
                name: "",
                email: "",
                phone: "",
                address: "",
                paymentTerms: 30,
            });
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
                    <h3 className="font-semibold">Add Client</h3>
                    <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Company/Client Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Acme Corporation"
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="contact@company.com"
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Phone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 (555) 123-4567"
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Address</label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="123 Main St, City, State, ZIP"
                            rows={2}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Payment Terms (Days)</label>
                        <select
                            value={formData.paymentTerms}
                            onChange={(e) => setFormData({ ...formData, paymentTerms: parseInt(e.target.value) })}
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value={7}>Net 7</option>
                            <option value={15}>Net 15</option>
                            <option value={30}>Net 30</option>
                            <option value={45}>Net 45</option>
                            <option value={60}>Net 60</option>
                            <option value={90}>Net 90</option>
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
                                "Add Client"
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
