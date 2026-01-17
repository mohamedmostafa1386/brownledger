"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Calendar, Scan, Save, Loader2, Search, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CameraBarcodeScanner } from "@/components/barcode/CameraBarcodeScanner";
import { ProductFormModal } from "@/components/inventory/ProductFormModal";
import { formatCurrency } from "@/lib/utils";

interface BillItem {
    id?: string;
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

interface BillFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function BillForm({ onClose, onSuccess }: BillFormProps) {
    const queryClient = useQueryClient();
    const [supplierId, setSupplierId] = useState("");
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
    const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
    const [billNumber, setBillNumber] = useState("");
    const [items, setItems] = useState<BillItem[]>([]);

    // Scanner & Modal States
    const [showScanner, setShowScanner] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [scannedBarcode, setScannedBarcode] = useState("");

    // Fetch Suppliers
    const { data: suppliers = [] } = useQuery({
        queryKey: ["suppliers"],
        queryFn: async () => {
            const res = await fetch("/api/suppliers");
            if (!res.ok) return [];
            return res.json();
        }
    });

    // Fetch Products (for manual search)
    const { data: products = [] } = useQuery({
        queryKey: ["products"],
        queryFn: async () => {
            const res = await fetch("/api/products");
            if (!res.ok) return [];
            return res.json();
        }
    });

    const createBillMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch("/api/bills", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to create bill");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["bills"] });
            onSuccess();
        }
    });

    const handleScan = (barcode: string) => {
        // 1. Try to find product
        const product = products.find((p: any) => p.sku === barcode || p.barcode === barcode);

        if (product) {
            // Add to items
            addItem(product);
            // Optional: Close scanner if single scan mode, but continuous is better here
            // setShowScanner(false);
        } else {
            // Prompt to create new
            setScannedBarcode(barcode);
            setShowScanner(false); // Close scanner to show modal
            setShowProductModal(true);
        }
    };

    const addItem = (product: any) => {
        setItems(prev => {
            const existing = prev.find(i => i.productId === product.id);
            if (existing) {
                return prev.map(i => i.productId === product.id
                    ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
                    : i
                );
            }
            return [...prev, {
                productId: product.id,
                description: product.name,
                quantity: 1,
                unitPrice: product.cost || 0,
                total: product.cost || 0
            }];
        });
    };

    const handleNewProductCreated = (newProduct: any) => {
        addItem(newProduct);
        setShowProductModal(false);
    };

    const updateItem = (index: number, field: keyof BillItem, value: any) => {
        setItems(prev => prev.map((item, i) => {
            if (i !== index) return item;
            const updates = { [field]: value };
            if (field === "quantity" || field === "unitPrice") {
                const qty = field === "quantity" ? parseFloat(value) || 0 : item.quantity;
                const price = field === "unitPrice" ? parseFloat(value) || 0 : item.unitPrice;
                updates.total = qty * price;
            }
            return { ...item, ...updates };
        }));
    };

    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const calculateTotal = () => items.reduce((sum, item) => sum + item.total, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createBillMutation.mutate({
            supplierId,
            billNumber,
            issueDate,
            dueDate,
            items: items.map(i => ({
                productId: i.productId,
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice
            }))
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-background rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">New Purchase Invoice</h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <form id="bill-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Top Section: Supplier & Details */}
                        <div className="grid md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1.5">Supplier</label>
                                <select
                                    required
                                    className="w-full h-10 rounded-lg border border-input px-3"
                                    value={supplierId}
                                    onChange={e => setSupplierId(e.target.value)}
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Bill Number</label>
                                <input
                                    required
                                    className="w-full h-10 rounded-lg border border-input px-3"
                                    placeholder="e.g. INV-001"
                                    value={billNumber}
                                    onChange={e => setBillNumber(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Total Amount</label>
                                <div className="h-10 px-3 bg-muted rounded-lg flex items-center font-semibold text-lg">
                                    {formatCurrency(calculateTotal())}
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Issue Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full h-10 rounded-lg border border-input px-3"
                                    value={issueDate}
                                    onChange={e => setIssueDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Due Date</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full h-10 rounded-lg border border-input px-3"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium">Items</h3>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowScanner(true)}
                                        className="h-9 px-3 bg-black text-white rounded-lg flex items-center gap-2 hover:bg-gray-800"
                                    >
                                        <Scan className="w-4 h-4" />
                                        Scan Barcode
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setItems([...items, { description: "", quantity: 1, unitPrice: 0, total: 0 }]);
                                        }}
                                        className="h-9 px-3 border border-input rounded-lg flex items-center gap-2 hover:bg-muted"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Line
                                    </button>
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Description</th>
                                            <th className="px-4 py-3 text-right w-24">Qty</th>
                                            <th className="px-4 py-3 text-right w-32">Price</th>
                                            <th className="px-4 py-3 text-right w-32">Total</th>
                                            <th className="px-4 py-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {items.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                    No items added. Scan a barcode or add line manually.
                                                </td>
                                            </tr>
                                        )}
                                        {items.map((item, i) => (
                                            <tr key={i}>
                                                <td className="p-2">
                                                    <input
                                                        className="w-full h-8 rounded border-input px-2"
                                                        value={item.description}
                                                        onChange={e => updateItem(i, "description", e.target.value)}
                                                        placeholder="Item name"
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        className="w-full h-8 rounded border-input px-2 text-right"
                                                        value={item.quantity}
                                                        onChange={e => updateItem(i, "quantity", e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        type="number"
                                                        className="w-full h-8 rounded border-input px-2 text-right"
                                                        value={item.unitPrice}
                                                        onChange={e => updateItem(i, "unitPrice", e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-2 text-right font-medium">
                                                    {formatCurrency(item.total)}
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(i)}
                                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-muted/20 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-input hover:bg-muted font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="bill-form"
                        disabled={createBillMutation.isPending}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium flex items-center gap-2"
                    >
                        {createBillMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Create Bill
                    </button>
                </div>
            </motion.div>

            {/* Scanner Overlay */}
            <CameraBarcodeScanner
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                onScan={handleScan}
                title="Scan Item to Add"
            />

            {/* New Product Modal */}
            <ProductFormModal
                isOpen={showProductModal}
                onClose={() => setShowProductModal(false)}
                initialBarcode={scannedBarcode}
                onSuccess={handleNewProductCreated}
            />
        </div>
    );
}
