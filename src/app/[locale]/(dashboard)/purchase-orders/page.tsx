"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Package, ShoppingBag, Check, X, Trash2, Tag } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import { BarcodeGeneratorModal } from "@/components/barcode";

interface PurchaseItem {
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

interface Purchase {
    id: string;
    poNumber: string;
    orderDate: string;
    expectedDate: string | null;
    status: string;
    total: number;
    notes?: string;
    supplier: { id: string; name: string };
    items: PurchaseItem[];
}

interface Supplier {
    id: string;
    name: string;
}

const fetchPurchases = async (): Promise<Purchase[]> => {
    const res = await fetch("/api/purchase-orders");
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
};

const fetchSuppliers = async (): Promise<Supplier[]> => {
    const res = await fetch("/api/suppliers");
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
};

const statusConfig: Record<string, { color: string; bg: string; label: string; labelAr: string }> = {
    DRAFT: { color: "text-gray-600", bg: "bg-gray-100", label: "Draft", labelAr: "مسودة" },
    PENDING_APPROVAL: { color: "text-yellow-600", bg: "bg-yellow-100", label: "Pending", labelAr: "معلق" },
    APPROVED: { color: "text-blue-600", bg: "bg-blue-100", label: "Approved", labelAr: "موافق عليه" },
    RECEIVED: { color: "text-green-600", bg: "bg-green-100", label: "Received", labelAr: "مستلم" },
    CANCELLED: { color: "text-red-600", bg: "bg-red-100", label: "Cancelled", labelAr: "ملغي" },
};

export default function PurchasesPage() {
    const { locale } = useI18n();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showStickerModal, setShowStickerModal] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        supplierId: "",
        expectedDate: "",
        notes: "",
    });
    const [items, setItems] = useState<PurchaseItem[]>([
        { description: "", quantity: 1, unitPrice: 0 }
    ]);

    const { data: purchases = [], isLoading } = useQuery({
        queryKey: ["purchases"],
        queryFn: fetchPurchases,
    });

    const { data: suppliers = [] } = useQuery({
        queryKey: ["suppliers"],
        queryFn: fetchSuppliers,
    });

    // Create purchase mutation
    const createPurchase = useMutation({
        mutationFn: async (data: { supplierId: string; expectedDate?: string; notes?: string; items: PurchaseItem[] }) => {
            const res = await fetch("/api/purchase-orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    orderDate: new Date().toISOString(),
                    status: "PENDING_APPROVAL",
                }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to create purchase");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["purchases"] });
            setShowCreateModal(false);
            resetForm();
        },
    });

    const resetForm = () => {
        setFormData({ supplierId: "", expectedDate: "", notes: "" });
        setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
    };

    const addItem = () => {
        setItems([...items, { description: "", quantity: 1, unitPrice: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.supplierId) {
            alert(locale === "ar" ? "يرجى اختيار المورد" : "Please select a supplier");
            return;
        }
        if (items.some(item => !item.description || item.quantity <= 0)) {
            alert(locale === "ar" ? "يرجى ملء جميع البنود بشكل صحيح" : "Please fill all items correctly");
            return;
        }
        createPurchase.mutate({
            supplierId: formData.supplierId,
            expectedDate: formData.expectedDate || undefined,
            notes: formData.notes || undefined,
            items: items,
        });
    };

    const filteredPurchases = purchases.filter((p) => {
        const matchesSearch =
            p.poNumber.toLowerCase().includes(search.toLowerCase()) ||
            p.supplier?.name?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const total = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + (p.total || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {locale === "ar" ? "المشتريات" : "Purchases"}
                    </h1>
                    <p className="text-muted-foreground">
                        {locale === "ar" ? "إدارة طلبات الشراء من الموردين" : "Manage purchase orders from suppliers"}
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    <Plus className="h-4 w-4" />
                    {locale === "ar" ? "طلب شراء جديد" : "New Purchase"}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">{locale === "ar" ? "إجمالي الطلبات" : "Total Orders"}</p>
                    <p className="text-2xl font-semibold">{purchases.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-yellow-50 p-4">
                    <p className="text-sm text-yellow-700">{locale === "ar" ? "قيد الانتظار" : "Pending"}</p>
                    <p className="text-2xl font-semibold text-yellow-700">
                        {purchases.filter(p => p.status === "PENDING_APPROVAL").length}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-green-50 p-4">
                    <p className="text-sm text-green-700">{locale === "ar" ? "مستلمة" : "Received"}</p>
                    <p className="text-2xl font-semibold text-green-700">
                        {purchases.filter(p => p.status === "RECEIVED").length}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-primary/10 p-4">
                    <p className="text-sm text-primary">{locale === "ar" ? "إجمالي القيمة" : "Total Value"}</p>
                    <p className="text-2xl font-semibold text-primary">{formatCurrency(totalPurchases)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={locale === "ar" ? "البحث عن المشتريات..." : "Search purchases..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    <option value="ALL">{locale === "ar" ? "جميع الحالات" : "All Status"}</option>
                    <option value="DRAFT">{locale === "ar" ? "مسودة" : "Draft"}</option>
                    <option value="PENDING_APPROVAL">{locale === "ar" ? "قيد الانتظار" : "Pending"}</option>
                    <option value="APPROVED">{locale === "ar" ? "موافق عليه" : "Approved"}</option>
                    <option value="RECEIVED">{locale === "ar" ? "مستلم" : "Received"}</option>
                </select>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{locale === "ar" ? "رقم الطلب" : "Order #"}</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{locale === "ar" ? "المورد" : "Supplier"}</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{locale === "ar" ? "التاريخ" : "Date"}</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{locale === "ar" ? "الحالة" : "Status"}</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">{locale === "ar" ? "المبلغ" : "Amount"}</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">{locale === "ar" ? "الإجراءات" : "Actions"}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3"><div className="h-4 w-20 skeleton rounded" /></td>
                                    <td className="px-4 py-3"><div className="h-4 w-28 skeleton rounded" /></td>
                                    <td className="px-4 py-3"><div className="h-4 w-24 skeleton rounded" /></td>
                                    <td className="px-4 py-3"><div className="h-5 w-20 skeleton rounded-full" /></td>
                                    <td className="px-4 py-3 text-right"><div className="h-4 w-16 skeleton rounded ml-auto" /></td>
                                    <td className="px-4 py-3 text-right"><div className="h-4 w-16 skeleton rounded ml-auto" /></td>
                                </tr>
                            ))
                        ) : filteredPurchases.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                    <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                    <p className="font-medium">{locale === "ar" ? "لا توجد مشتريات" : "No purchases found"}</p>
                                    <p className="text-sm">{locale === "ar" ? "ابدأ بإنشاء طلب شراء جديد" : "Start by creating a new purchase order"}</p>
                                </td>
                            </tr>
                        ) : (
                            filteredPurchases.map((purchase, index) => {
                                const config = statusConfig[purchase.status] || statusConfig.DRAFT;
                                return (
                                    <motion.tr
                                        key={purchase.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-muted/50"
                                    >
                                        <td className="px-4 py-3 font-medium">{purchase.poNumber}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{purchase.supplier?.name || "-"}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{formatDate(purchase.orderDate)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}>
                                                {locale === "ar" ? config.labelAr : config.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(purchase.total || 0)}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedPurchase(purchase);
                                                    setShowStickerModal(true);
                                                }}
                                                className="p-1.5 hover:bg-muted rounded text-primary"
                                                title={locale === "ar" ? "طباعة الملصقات" : "Print Stickers"}
                                            >
                                                <Tag className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Purchase Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card rounded-xl p-6 max-w-2xl w-full mx-4 border border-border max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">
                                {locale === "ar" ? "طلب شراء جديد" : "New Purchase Order"}
                            </h2>
                            <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-muted rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        {locale === "ar" ? "المورد" : "Supplier"} *
                                    </label>
                                    <select
                                        value={formData.supplierId}
                                        onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                                        required
                                    >
                                        <option value="">{locale === "ar" ? "اختر المورد..." : "Select supplier..."}</option>
                                        {suppliers.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        {locale === "ar" ? "تاريخ التسليم المتوقع" : "Expected Date"}
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.expectedDate}
                                        onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="mb-1.5 block text-sm font-medium">
                                    {locale === "ar" ? "البنود" : "Items"} *
                                </label>
                                <div className="border border-border rounded-lg p-4 space-y-3">
                                    <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                                        <div className="col-span-5">{locale === "ar" ? "الوصف" : "Description"}</div>
                                        <div className="col-span-2">{locale === "ar" ? "الكمية" : "Qty"}</div>
                                        <div className="col-span-3">{locale === "ar" ? "السعر" : "Price"}</div>
                                        <div className="col-span-2">{locale === "ar" ? "الإجمالي" : "Total"}</div>
                                    </div>
                                    {items.map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                            <input
                                                type="text"
                                                placeholder={locale === "ar" ? "وصف المنتج" : "Product description"}
                                                value={item.description}
                                                onChange={(e) => updateItem(index, "description", e.target.value)}
                                                className="col-span-5 h-9 rounded border border-input bg-background px-2 text-sm"
                                                required
                                            />
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                                                className="col-span-2 h-9 rounded border border-input bg-background px-2 text-sm text-center"
                                            />
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unitPrice}
                                                onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                                                className="col-span-3 h-9 rounded border border-input bg-background px-2 text-sm"
                                            />
                                            <div className="col-span-1 text-sm font-medium">
                                                {formatCurrency(item.quantity * item.unitPrice)}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="col-span-1 p-1 hover:bg-red-100 rounded text-red-600"
                                                disabled={items.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="text-sm text-primary hover:underline"
                                    >
                                        + {locale === "ar" ? "إضافة بند" : "Add Item"}
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="mb-1.5 block text-sm font-medium">
                                    {locale === "ar" ? "ملاحظات" : "Notes"}
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={2}
                                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                                    placeholder={locale === "ar" ? "ملاحظات إضافية..." : "Additional notes..."}
                                />
                            </div>

                            <div className="flex justify-between items-center mb-6 p-3 bg-muted/50 rounded-lg">
                                <span className="font-medium">{locale === "ar" ? "الإجمالي:" : "Total:"}</span>
                                <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={createPurchase.isPending}
                                    className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {createPurchase.isPending
                                        ? (locale === "ar" ? "جاري الإنشاء..." : "Creating...")
                                        : (locale === "ar" ? "إنشاء طلب الشراء" : "Create Purchase Order")
                                    }
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                                    className="h-10 px-4 rounded-lg border border-input font-medium hover:bg-muted"
                                >
                                    {locale === "ar" ? "إلغاء" : "Cancel"}
                                </button>
                            </div>

                            {createPurchase.isError && (
                                <p className="mt-3 text-sm text-red-600">
                                    {(createPurchase.error as Error).message}
                                </p>
                            )}
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Barcode Sticker Modal */}
            {showStickerModal && selectedPurchase && (
                <BarcodeGeneratorModal
                    isOpen={showStickerModal}
                    onClose={() => setShowStickerModal(false)}
                    items={(selectedPurchase.items || []).map((item, i) => ({
                        id: `${selectedPurchase.id}-item-${i}`,
                        productName: item.description,
                        sku: `SKU-${selectedPurchase.poNumber}-${i + 1}`,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                    }))}
                    orderNumber={selectedPurchase.poNumber}
                />
            )}
        </div>
    );
}
