"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n-context";
import { formatCurrency } from "@/lib/utils";
import { X, Search, Package, Trash2, RotateCcw, Receipt, AlertCircle, Building2 } from "lucide-react";
import { motion } from "framer-motion";

interface PurchaseReturnFormProps {
    onClose: () => void;
    preselectedBillId?: string;
}

export function PurchaseReturnForm({ onClose, preselectedBillId }: PurchaseReturnFormProps) {
    const { t, locale } = useI18n();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        supplierId: "",
        billId: preselectedBillId || "",
        returnDate: new Date().toISOString().split("T")[0],
        reason: "",
        items: [] as any[],
    });

    const [searchTerm, setSearchTerm] = useState("");

    // Queries
    const { data: suppliers } = useQuery({
        queryKey: ["suppliers"],
        queryFn: () => fetch("/api/suppliers").then(r => r.json()),
    });

    const { data: bills } = useQuery({
        queryKey: ["bills", formData.supplierId],
        queryFn: () => fetch("/api/bills").then(r => r.json()), // Adjust path if needed
        enabled: !!formData.supplierId,
    });

    const { data: products } = useQuery({
        queryKey: ["products"],
        queryFn: () => fetch("/api/products").then(r => r.json()),
    });

    // Auto-fill supplier and items if bill is preselected
    const { data: preselectedBillData } = useQuery({
        queryKey: ["bill", preselectedBillId],
        queryFn: () => fetch(`/api/bills/${preselectedBillId}`).then(r => r.json()), // Assuming this endpoint exists or should
        enabled: !!preselectedBillId,
    });

    useEffect(() => {
        if (preselectedBillData) {
            setFormData(prev => ({
                ...prev,
                supplierId: preselectedBillData.supplierId,
                items: preselectedBillData.items.map((item: any) => ({
                    productId: item.productId,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    taxRate: item.taxRate || 0,
                }))
            }));
        }
    }, [preselectedBillData]);

    const createReturnMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch("/api/returns/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create return");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchase-returns"] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            onClose();
        },
    });

    const addItem = (product: any) => {
        const existing = formData.items.find(item => item.productId === product.id);
        if (existing) {
            setFormData({
                ...formData,
                items: formData.items.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            });
        } else {
            setFormData({
                ...formData,
                items: [
                    ...formData.items,
                    {
                        productId: product.id,
                        description: product.name,
                        quantity: 1,
                        unitPrice: product.costPrice || 0,
                        taxRate: product.taxRate || 0,
                    }
                ]
            });
        }
    };

    const removeItem = (index: number) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index)
        });
    };

    const updateItem = (index: number, field: string, value: any) => {
        setFormData({
            ...formData,
            items: formData.items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.items.length === 0) return;
        createReturnMutation.mutate(formData);
    };

    const subtotal = formData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const taxTotal = formData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice * (item.taxRate / 100)), 0);
    const total = subtotal + taxTotal;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-card w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary/20 rounded-lg">
                            <RotateCcw className="w-5 h-5 text-secondary-foreground" />
                        </div>
                        <h2 className="text-xl font-bold">{locale === "ar" ? "تسجيل مرتجع مشتريات" : "New Purchase Return"}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">{locale === "ar" ? "المورد" : "Supplier"} *</label>
                                <select
                                    className="w-full h-11 border border-border rounded-xl bg-background px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-muted disabled:cursor-not-allowed"
                                    value={formData.supplierId}
                                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value, billId: "" })}
                                    required
                                    disabled={!!preselectedBillId}
                                >
                                    <option value="">{locale === "ar" ? "اختر المورد..." : "Select Supplier..."}</option>
                                    {Array.isArray(suppliers) && suppliers.map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">{locale === "ar" ? "تاريخ المرتجع" : "Return Date"}</label>
                                <input
                                    type="date"
                                    className="w-full h-11 border border-border rounded-xl bg-background px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    value={formData.returnDate}
                                    onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">{locale === "ar" ? "المرجع (رقم الفاتورة)" : "Reference (Bill Number)"}</label>
                                <select
                                    className="w-full h-11 border border-border rounded-xl bg-background px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-muted disabled:cursor-not-allowed"
                                    value={formData.billId}
                                    onChange={(e) => setFormData({ ...formData, billId: e.target.value })}
                                    disabled={!!preselectedBillId}
                                >
                                    <option value="">{locale === "ar" ? "بدون مرجع" : "No Reference"}</option>
                                    {Array.isArray(bills) && bills.map((bill: any) => (
                                        <option key={bill.id} value={bill.id}>Bill: {bill.billNumber}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="md:col-span-2 space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{locale === "ar" ? "الأصناف المرتجعة" : "Returned Items"}</label>
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder={locale === "ar" ? "بحث عن صنف..." : "Search product..."}
                                        className="w-full h-9 pl-10 pr-4 border border-border rounded-lg text-sm bg-muted/30 focus:bg-background transition-all outline-none"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && (
                                        <div className="absolute top-full left-0 w-full bg-card border border-border rounded-xl mt-1 shadow-xl z-10 max-h-48 overflow-y-auto">
                                            {products?.filter((p: any) => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((p: any) => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => { addItem(p); setSearchTerm(""); }}
                                                    className="w-full p-2 text-left text-sm hover:bg-muted flex items-center justify-between"
                                                >
                                                    <span>{p.name}</span>
                                                    <span className="text-xs text-muted-foreground">{formatCurrency(p.costPrice)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="border border-border rounded-xl overflow-hidden bg-muted/10 min-h-[200px]">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted text-xs uppercase tracking-wider font-bold text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-2 font-medium">{locale === "ar" ? "الصنف" : "Item"}</th>
                                            <th className="px-4 py-2 font-medium w-24">{locale === "ar" ? "الكمية" : "Qty"}</th>
                                            <th className="px-4 py-2 font-medium w-32">{locale === "ar" ? "السعر" : "Price"}</th>
                                            <th className="px-4 py-2 font-medium w-32 text-right">{locale === "ar" ? "الإجمالي" : "Total"}</th>
                                            <th className="px-4 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {formData.items.length === 0 ? (
                                            <tr><td colSpan={5} className="p-8 text-center text-muted-foreground italic">{locale === "ar" ? "أضف أصنافاً للبدء" : "Add items to get started"}</td></tr>
                                        ) : (
                                            formData.items.map((item, index) => (
                                                <tr key={index} className="bg-card">
                                                    <td className="px-4 py-2 font-medium">{item.description}</td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            className="w-full border border-border rounded p-1 text-center bg-transparent"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value))}
                                                            min="0.1"
                                                            step="0.1"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            className="w-full border border-border rounded p-1 text-center bg-transparent font-mono text-xs"
                                                            value={item.unitPrice}
                                                            onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value))}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-bold">
                                                        {formatCurrency(item.quantity * item.unitPrice)}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(index)}
                                                            className="text-red-500 hover:text-red-700 p-1"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                        <div>
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-2">{locale === "ar" ? "السبب / ملاحظات" : "Reason / Notes"}</label>
                            <textarea
                                className="w-full border border-border rounded-xl p-4 bg-background h-24 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder={locale === "ar" ? "سبب الارتجاع..." : "Reason for return..."}
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            />
                        </div>
                        <div className="bg-muted/30 rounded-2xl p-6 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{locale === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
                                <span className="font-medium">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{locale === "ar" ? "الضريبة" : "Tax"}</span>
                                <span className="font-medium">{formatCurrency(taxTotal)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t border-border pt-3 mt-3">
                                <span>{locale === "ar" ? "الإجمالي النهائي" : "Total Return"}</span>
                                <span className="text-primary font-bold">{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>

                    {createReturnMutation.isError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
                            <AlertCircle className="w-5 h-5" />
                            <span>{(createReturnMutation.error as any).message}</span>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 px-6 rounded-xl border border-border font-medium hover:bg-muted transition-colors"
                    >
                        {locale === "ar" ? "إلغاء" : "Cancel"}
                    </button>
                    <button
                        type="submit"
                        disabled={createReturnMutation.isPending || formData.items.length === 0}
                        onClick={handleSubmit}
                        className="h-11 px-8 rounded-xl bg-secondary text-secondary-foreground font-bold hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20 disabled:opacity-50"
                    >
                        {createReturnMutation.isPending ? t("common.saving") : (locale === "ar" ? "تأكيد المرتجع" : "Submit Return")}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
