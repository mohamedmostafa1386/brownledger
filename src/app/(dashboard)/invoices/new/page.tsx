"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Trash2, Save, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { AIInvoiceGenerator } from "@/components/invoices/ai-invoice-generator";

interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

export default function NewInvoicePage() {
    const router = useRouter();
    const [items, setItems] = useState<InvoiceItem[]>([
        { id: "1", description: "", quantity: 1, unitPrice: 0 },
    ]);
    const [taxRate, setTaxRate] = useState(10);
    const [showAIGenerator, setShowAIGenerator] = useState(true);

    const addItem = () => {
        setItems([
            ...items,
            { id: Date.now().toString(), description: "", quantity: 1, unitPrice: 0 },
        ]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter((item) => item.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
        setItems(
            items.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Submit to API
        router.push("/invoices");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/invoices"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-input hover:bg-muted"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">New Invoice</h1>
                        <p className="text-muted-foreground">Create a new invoice for your client.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAIGenerator(!showAIGenerator)}
                    className={`flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium ${showAIGenerator
                            ? "bg-primary/10 text-primary"
                            : "border border-input hover:bg-muted"
                        }`}
                >
                    <Sparkles className="h-4 w-4" />
                    AI Generator
                </button>
            </div>

            {/* AI Generator */}
            {showAIGenerator && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    <AIInvoiceGenerator />
                </motion.div>
            )}

            <div className="flex items-center gap-4">
                <div className="flex-1 border-t border-border" />
                <span className="text-sm text-muted-foreground">or create manually</span>
                <div className="flex-1 border-t border-border" />
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Client & Details */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-xl border border-border bg-card p-6"
                        >
                            <h2 className="font-semibold mb-4">Invoice Details</h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Client</label>
                                    <select className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                                        <option value="">Select a client...</option>
                                        <option value="1">Tech Solutions Inc</option>
                                        <option value="2">Global Enterprises</option>
                                        <option value="3">Startup Labs</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Invoice Number</label>
                                    <input
                                        type="text"
                                        defaultValue="INV-006"
                                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Issue Date</label>
                                    <input
                                        type="date"
                                        defaultValue={new Date().toISOString().split("T")[0]}
                                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">Due Date</label>
                                    <input
                                        type="date"
                                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Line Items */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="rounded-xl border border-border bg-card p-6"
                        >
                            <h2 className="font-semibold mb-4">Line Items</h2>
                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-3 items-start">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                placeholder="Description"
                                                value={item.description}
                                                onChange={(e) => updateItem(item.id, "description", e.target.value)}
                                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                            />
                                        </div>
                                        <div className="w-24">
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                min={1}
                                                value={item.quantity}
                                                onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                            />
                                        </div>
                                        <div className="w-32">
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                min={0}
                                                step={0.01}
                                                value={item.unitPrice}
                                                onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-input text-muted-foreground hover:bg-muted hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={addItem}
                                className="mt-4 flex h-9 items-center gap-2 rounded-lg border border-dashed border-input px-4 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary"
                            >
                                <Plus className="h-4 w-4" />
                                Add Item
                            </button>
                        </motion.div>

                        {/* Notes */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="rounded-xl border border-border bg-card p-6"
                        >
                            <h2 className="font-semibold mb-4">Notes</h2>
                            <textarea
                                placeholder="Add any notes for the client..."
                                rows={4}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </motion.div>
                    </div>

                    {/* Summary Sidebar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-6"
                    >
                        <div className="rounded-xl border border-border bg-card p-6 sticky top-24">
                            <h2 className="font-semibold mb-4">Summary</h2>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Tax</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={taxRate}
                                            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                            className="h-8 w-16 rounded border border-input bg-background px-2 text-sm text-center"
                                        />
                                        <span>%</span>
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Tax Amount</span>
                                    <span>${tax.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-border my-3" />
                                <div className="flex justify-between text-lg font-semibold">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mt-6 space-y-3">
                                <button
                                    type="submit"
                                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary font-medium text-primary-foreground hover:bg-primary/90"
                                >
                                    <Save className="h-4 w-4" />
                                    Save Invoice
                                </button>
                                <button
                                    type="button"
                                    className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-input font-medium hover:bg-muted"
                                >
                                    Save as Draft
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </form>
        </div>
    );
}
