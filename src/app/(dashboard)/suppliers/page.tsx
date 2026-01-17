"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Download, Filter, Star, Building2, Phone, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { AddSupplierModal } from "@/components/suppliers/add-supplier-modal";
import { useI18n } from "@/lib/i18n-context";

interface Supplier {
    id: string;
    name: string;
    contactPerson: string | null;
    email: string | null;
    phone: string | null;
    paymentTerms: number;
    rating: number | null;
    isActive: boolean;
    totalSpent: number;
    _count: {
        bills: number;
        expenses: number;
        purchaseOrders: number;
    };
}

const fetchSuppliers = async (search: string, activeOnly: boolean): Promise<Supplier[]> => {
    const res = await fetch(`/api/suppliers?search=${search}&active=${activeOnly}`);
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
};

export default function SuppliersPage() {
    const { t, locale } = useI18n();
    const [search, setSearch] = useState("");
    const [activeOnly, setActiveOnly] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const { data: suppliers = [], isLoading } = useQuery({
        queryKey: ["suppliers", search, activeOnly],
        queryFn: () => fetchSuppliers(search, activeOnly),
    });

    const totalSpent = suppliers.reduce((sum, s) => sum + (s.totalSpent || 0), 0);
    const activeCount = suppliers.filter((s) => s.isActive).length;
    const totalBills = suppliers.reduce((sum, s) => sum + s._count.bills, 0);

    const handleExport = () => {
        // Export to Excel
        const data = suppliers.map((s) => ({
            Name: s.name,
            Contact: s.contactPerson || "",
            Email: s.email || "",
            Phone: s.phone || "",
            "Payment Terms": `Net ${s.paymentTerms}`,
            Rating: s.rating || 0,
            Status: s.isActive ? "Active" : "Inactive",
            Bills: s._count.bills,
            "Total Spent": s.totalSpent,
        }));

        import("xlsx").then((XLSX) => {
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Suppliers");
            XLSX.writeFile(wb, "suppliers.xlsx");
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">{locale === "ar" ? "الموردين" : "Suppliers"}</h1>
                    <p className="text-muted-foreground">{locale === "ar" ? "إدارة الموردين والبائعين" : "Manage your vendors and suppliers."}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium hover:bg-muted"
                    >
                        <Download className="h-4 w-4" />
                        {locale === "ar" ? "تصدير" : "Export"}
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        {locale === "ar" ? "إضافة مورد" : "Add Supplier"}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">{locale === "ar" ? "إجمالي الموردين" : "Total Suppliers"}</p>
                    <p className="text-2xl font-semibold">{suppliers.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-green-50 p-4">
                    <p className="text-sm text-green-700">{locale === "ar" ? "نشط" : "Active"}</p>
                    <p className="text-2xl font-semibold text-green-700">{activeCount}</p>
                </div>
                <div className="rounded-xl border border-border bg-blue-50 p-4">
                    <p className="text-sm text-blue-700">{locale === "ar" ? "إجمالي الفواتير" : "Total Bills"}</p>
                    <p className="text-2xl font-semibold text-blue-700">{totalBills}</p>
                </div>
                <div className="rounded-xl border border-border bg-primary/10 p-4">
                    <p className="text-sm text-primary">{locale === "ar" ? "إجمالي المصروف" : "Total Spent"}</p>
                    <p className="text-2xl font-semibold text-primary">{formatCurrency(totalSpent)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={locale === "ar" ? "البحث عن الموردين..." : "Search suppliers by name, email, or contact..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <button
                    onClick={() => setActiveOnly(!activeOnly)}
                    className={`flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium ${activeOnly
                        ? "bg-green-100 text-green-700"
                        : "border border-input bg-background hover:bg-muted"
                        }`}
                >
                    <Filter className="h-4 w-4" />
                    {activeOnly ? (locale === "ar" ? "النشطون فقط" : "Active Only") : (locale === "ar" ? "جميع الموردين" : "All Suppliers")}
                </button>
            </div>

            {/* Supplier Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-border bg-card p-6">
                            <div className="h-6 w-32 skeleton rounded mb-2" />
                            <div className="h-4 w-48 skeleton rounded mb-4" />
                            <div className="h-4 w-24 skeleton rounded" />
                        </div>
                    ))
                ) : suppliers.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>{locale === "ar" ? "لا يوجد موردون" : "No suppliers found"}</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-4 text-primary hover:underline"
                        >
                            {locale === "ar" ? "أضف أول مورد" : "Add your first supplier"}
                        </button>
                    </div>
                ) : (
                    suppliers.map((supplier, index) => (
                        <motion.div
                            key={supplier.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`h-3 w-3 ${star <= (supplier.rating || 0)
                                                ? "text-yellow-500 fill-yellow-500"
                                                : "text-gray-300"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <h3 className="font-semibold mb-1">{supplier.name}</h3>
                            {supplier.contactPerson && (
                                <p className="text-sm text-muted-foreground mb-2">{supplier.contactPerson}</p>
                            )}

                            <div className="space-y-1 text-sm text-muted-foreground">
                                {supplier.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3 w-3" />
                                        {supplier.email}
                                    </div>
                                )}
                                {supplier.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3 w-3" />
                                        {supplier.phone}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-border flex justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">{locale === "ar" ? "الفواتير" : "Bills"}</p>
                                    <p className="font-semibold">{supplier._count.bills}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">{locale === "ar" ? "أوامر الشراء" : "POs"}</p>
                                    <p className="font-semibold">{supplier._count.purchaseOrders}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">{locale === "ar" ? "إجمالي المصروف" : "Total Spent"}</p>
                                    <p className="font-semibold text-primary">{formatCurrency(supplier.totalSpent)}</p>
                                </div>
                            </div>

                            {!supplier.isActive && (
                                <div className="mt-3 text-xs text-red-600 bg-red-50 rounded px-2 py-1 text-center">
                                    {locale === "ar" ? "غير نشط" : "Inactive"}
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal */}
            <AddSupplierModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
        </div>
    );
}
