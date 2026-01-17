"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Check, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface GeneratedItem {
    description: string;
    quantity: number;
    unitPrice: number;
}

interface GeneratedInvoice {
    clientId: string;
    clientName: string;
    items: GeneratedItem[];
    dueDate: string;
    notes: string;
    isNewClient: boolean;
}

export function AIInvoiceGenerator() {
    const [description, setDescription] = useState("");
    const [preview, setPreview] = useState<GeneratedInvoice | null>(null);
    const queryClient = useQueryClient();

    const generateMutation = useMutation({
        mutationFn: async (desc: string) => {
            const res = await fetch("/api/invoices/ai-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description: desc, createImmediately: false }),
            });
            return res.json();
        },
        onSuccess: (data) => {
            if (data.preview) {
                setPreview(data.preview);
            }
        },
    });

    const createMutation = useMutation({
        mutationFn: async (desc: string) => {
            const res = await fetch("/api/invoices/ai-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description: desc, createImmediately: true }),
            });
            return res.json();
        },
        onSuccess: () => {
            setDescription("");
            setPreview(null);
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
        },
    });

    const handleGenerate = () => {
        if (description.trim()) {
            generateMutation.mutate(description);
        }
    };

    const handleCreate = () => {
        if (description.trim()) {
            createMutation.mutate(description);
        }
    };

    const total = preview?.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
    ) || 0;

    return (
        <div className="rounded-xl border border-border bg-gradient-to-r from-primary/5 to-primary/10 p-6">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">AI Invoice Generator</h4>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Beta
                </span>
            </div>

            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='Describe the invoice: "Create invoice for Acme Corp for 5 hours consulting at $150/hr, due in 30 days"'
                className="w-full h-24 p-3 border border-input bg-background rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />

            <div className="flex gap-2 mt-3">
                <button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending || !description.trim()}
                    className="flex-1 flex items-center justify-center gap-2 h-10 bg-card border border-input rounded-lg font-medium text-sm hover:bg-muted disabled:opacity-50"
                >
                    {generateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Sparkles className="h-4 w-4" />
                    )}
                    Preview
                </button>
                <button
                    onClick={handleCreate}
                    disabled={createMutation.isPending || !description.trim()}
                    className="flex-1 flex items-center justify-center gap-2 h-10 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50"
                >
                    {createMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <ArrowRight className="h-4 w-4" />
                    )}
                    Create Invoice
                </button>
            </div>

            <AnimatePresence>
                {preview && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 p-4 bg-card border border-border rounded-lg"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">
                                AI Generated Preview
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Client</span>
                                <span className="font-medium">
                                    {preview.clientName}
                                    {preview.isNewClient && (
                                        <span className="ml-1 text-xs text-amber-600">(New)</span>
                                    )}
                                </span>
                            </div>

                            <div className="border-t border-border pt-3">
                                <p className="text-xs text-muted-foreground mb-2">Items</p>
                                {preview.items.map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm py-1">
                                        <span>
                                            {item.description} × {item.quantity}
                                        </span>
                                        <span>{formatCurrency(item.quantity * item.unitPrice)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between text-sm font-semibold border-t border-border pt-3">
                                <span>Total</span>
                                <span>{formatCurrency(total)}</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Due Date</span>
                                <span>{new Date(preview.dueDate).toLocaleDateString()}</span>
                            </div>

                            {preview.notes && (
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Notes: </span>
                                    {preview.notes}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {createMutation.isSuccess && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
                >
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-700">Invoice created successfully!</span>
                </motion.div>
            )}
        </div>
    );
}
