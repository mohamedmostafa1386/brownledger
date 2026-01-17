"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, AlertCircle } from "lucide-react";
import { useQueryClient, useMutation } from "@tanstack/react-query";

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialBarcode?: string;
    onSuccess?: (product: any) => void;
}

export function ProductFormModal({
    isOpen,
    onClose,
    initialBarcode,
    onSuccess,
}: ProductFormModalProps) {
    const queryClient = useQueryClient();
    const [name, setName] = useState("");
    const [sku, setSku] = useState(initialBarcode || "");
    const [price, setPrice] = useState("");
    const [cost, setCost] = useState("");
    const [stock, setStock] = useState("0");
    const [description, setDescription] = useState("");

    // Update sku if initialBarcode changes
    useEffect(() => {
        if (initialBarcode) setSku(initialBarcode);
    }, [initialBarcode]);

    const createProductMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to create product");
            }
            return res.json();
        },
        onSuccess: (newProduct) => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            if (onSuccess) onSuccess(newProduct);
            onClose();
            // Reset form
            setName("");
            setPrice("");
            setCost("");
            setStock("0");
            setDescription("");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createProductMutation.mutate({
            name,
            sku,
            price: parseFloat(price) || 0,
            cost: parseFloat(cost) || 0,
            stock: parseInt(stock) || 0,
            description,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card rounded-xl shadow-lg max-w-lg w-full overflow-hidden border border-border"
            >
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold">New Product</h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {createProductMutation.error && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {(createProductMutation.error as Error).message}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1.5">Product Name *</label>
                            <input
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20"
                                placeholder="e.g. Wireless Mouse"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">Barcode / SKU</label>
                            <input
                                value={sku}
                                onChange={(e) => setSku(e.target.value)}
                                className="w-full h-10 rounded-lg border border-input bg-background/50 px-3 text-sm font-mono"
                                placeholder="Scan or type..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">Initial Stock</label>
                            <input
                                type="number"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">Cost Price</label>
                            <input
                                type="number"
                                step="0.01"
                                value={cost}
                                onChange={(e) => setCost(e.target.value)}
                                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">Selling Price *</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                                placeholder="0.00"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1.5">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm h-20 resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium border border-input rounded-lg hover:bg-muted"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createProductMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                        >
                            {createProductMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Create Product
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
