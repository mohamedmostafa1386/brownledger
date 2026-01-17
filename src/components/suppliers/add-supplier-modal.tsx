"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { X, Loader2, Star } from "lucide-react";

interface AddSupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplier?: {
        id: string;
        name: string;
        contactPerson?: string;
        email?: string;
        phone?: string;
        website?: string;
        address?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        taxId?: string;
        paymentTerms: number;
        currency: string;
        bankAccount?: string;
        notes?: string;
        rating?: number;
    };
}

export function AddSupplierModal({ isOpen, onClose, supplier }: AddSupplierModalProps) {
    const queryClient = useQueryClient();
    const isEditing = !!supplier;

    const [formData, setFormData] = useState({
        name: supplier?.name || "",
        contactPerson: supplier?.contactPerson || "",
        email: supplier?.email || "",
        phone: supplier?.phone || "",
        website: supplier?.website || "",
        address: supplier?.address || "",
        city: supplier?.city || "",
        state: supplier?.state || "",
        zipCode: supplier?.zipCode || "",
        country: supplier?.country || "",
        taxId: supplier?.taxId || "",
        paymentTerms: supplier?.paymentTerms || 30,
        currency: supplier?.currency || "USD",
        bankAccount: supplier?.bankAccount || "",
        notes: supplier?.notes || "",
        rating: supplier?.rating || 0,
    });

    const mutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const url = isEditing ? `/api/suppliers/${supplier.id}` : "/api/suppliers";
            const method = isEditing ? "PUT" : "POST";
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Failed to save supplier");
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] });
            onClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-xl border border-border shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4 sticky top-0 bg-card">
                    <h3 className="font-semibold text-lg">{isEditing ? "Edit" : "Add"} Supplier</h3>
                    <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div>
                        <h4 className="font-medium mb-3 text-sm text-muted-foreground">Basic Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Supplier Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Office Depot"
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Contact Person</label>
                                <input
                                    type="text"
                                    value={formData.contactPerson}
                                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                    placeholder="John Doe"
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="font-medium mb-3 text-sm text-muted-foreground">Contact Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="contact@supplier.com"
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
                            <div className="col-span-2">
                                <label className="mb-1.5 block text-sm font-medium">Website</label>
                                <input
                                    type="url"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    placeholder="https://supplier.com"
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <h4 className="font-medium mb-3 text-sm text-muted-foreground">Address</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Street Address</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="123 Main Street"
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">City</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">State</label>
                                    <input
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Zip Code</label>
                                    <input
                                        type="text"
                                        value={formData.zipCode}
                                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment & Tax */}
                    <div>
                        <h4 className="font-medium mb-3 text-sm text-muted-foreground">Payment Information</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Payment Terms (days)</label>
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
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Currency</label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                >
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                    <option value="EGP">EGP</option>
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium">Tax ID</label>
                                <input
                                    type="text"
                                    value={formData.taxId}
                                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rating */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Supplier Rating</label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, rating: star })}
                                    className="p-1"
                                >
                                    <Star
                                        className={`h-6 w-6 ${star <= formData.rating
                                                ? "text-yellow-500 fill-yellow-500"
                                                : "text-gray-300"
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Additional notes about this supplier..."
                            rows={3}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-10 rounded-lg border border-input font-medium hover:bg-muted"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex-1 h-10 rounded-lg bg-primary font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                            {mutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                            ) : isEditing ? (
                                "Update Supplier"
                            ) : (
                                "Create Supplier"
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
