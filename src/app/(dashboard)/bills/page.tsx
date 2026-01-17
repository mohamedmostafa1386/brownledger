"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, FileText, Clock, AlertCircle, CheckCircle, X, CreditCard, Calendar, Download, ArrowRight, ArrowRightLeft, DollarSign, Building2, Eye, Edit2, Tag } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import { PurchaseReturnForm } from "@/components/returns/PurchaseReturnForm";
import { BarcodeGeneratorModal } from "@/components/barcode";
import { BillForm } from "@/components/bills/BillForm";

interface Bill {
    id: string;
    billNumber: string;
    issueDate: string;
    dueDate: string;
    status: string;
    total: number;
    amountPaid?: number;
    supplier: { id: string; name: string };
    items?: { description: string; quantity: number; unitPrice: number }[];
}

interface PaymentSchedule {
    id: string;
    billId: string;
    dueDate: string;
    amount: number;
    status: "upcoming" | "paid" | "overdue";
}

const fetchBills = async (): Promise<Bill[]> => {
    const res = await fetch("/api/bills");
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
};

const statusConfig: Record<string, { color: string; icon: React.ElementType; bg: string }> = {
    DRAFT: { color: "text-gray-600", icon: FileText, bg: "bg-gray-100" },
    PENDING: { color: "text-amber-600", icon: Clock, bg: "bg-amber-100" },
    APPROVED: { color: "text-blue-600", icon: CheckCircle, bg: "bg-blue-100" },
    PAID: { color: "text-green-600", icon: CheckCircle, bg: "bg-green-100" },
    PARTIAL: { color: "text-purple-600", icon: CreditCard, bg: "bg-purple-100" },
    OVERDUE: { color: "text-red-600", icon: AlertCircle, bg: "bg-red-100" },
};

// Mock payment schedule
const MOCK_SCHEDULE: PaymentSchedule[] = [
    { id: "1", billId: "b1", dueDate: "2024-12-15", amount: 5000, status: "upcoming" },
    { id: "2", billId: "b2", dueDate: "2024-12-20", amount: 3200, status: "upcoming" },
    { id: "3", billId: "b3", dueDate: "2024-12-25", amount: 7500, status: "upcoming" },
];

export default function BillsPage() {
    const { t, locale } = useI18n();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
    const [showDebitNoteModal, setShowDebitNoteModal] = useState(false);
    const [showStickerModal, setShowStickerModal] = useState(false);

    const { data: bills = [], isLoading } = useQuery({
        queryKey: ["bills"],
        queryFn: fetchBills,
    });

    // Enhance bills with mock additional data
    const enhancedBills = Array.isArray(bills) ? bills.map((bill, i) => ({
        ...bill,
        amountPaid: bill.status === "PAID" ? bill.total : i % 3 === 0 ? bill.total * 0.5 : 0,
        items: [
            { description: "Product/Service 1", quantity: 2, unitPrice: bill.total * 0.4 },
            { description: "Product/Service 2", quantity: 1, unitPrice: bill.total * 0.6 },
        ],
    })) : [];

    const filteredBills = Array.isArray(enhancedBills) ? enhancedBills.filter((bill) => {
        const matchesSearch =
            bill.billNumber.toLowerCase().includes(search.toLowerCase()) ||
            bill.supplier.name.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || bill.status === statusFilter;
        return matchesSearch && matchesStatus;
    }) : [];

    const totalPayable = enhancedBills
        .filter((b) => b.status === "PENDING" || b.status === "APPROVED" || b.status === "PARTIAL")
        .reduce((sum, b) => sum + (b.total - (b.amountPaid || 0)), 0);
    const overdueCount = enhancedBills.filter((b) => b.status === "OVERDUE").length;
    const pendingCount = enhancedBills.filter((b) => b.status === "PENDING").length;
    const thisWeekDue = MOCK_SCHEDULE.filter(s => s.status === "upcoming").reduce((sum, s) => sum + s.amount, 0);

    const handleRecordPayment = () => {
        // Mock payment recording
        console.log("Recording payment:", {
            billId: selectedBill?.id,
            amount: parseFloat(paymentAmount),
            method: paymentMethod,
        });
        setShowPaymentModal(false);
        setSelectedBill(null);
        setPaymentAmount("");
    };

    const handleExport = () => {
        const csv = enhancedBills.map(b =>
            `${b.billNumber},${b.supplier.name},${b.issueDate},${b.dueDate},${b.status},${b.total}`
        ).join("\n");
        const blob = new Blob([`Bill #,Supplier,Issue Date,Due Date,Status,Amount\n${csv}`], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "bills.csv";
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Purchases</h1>
                    <p className="text-muted-foreground">{locale === "ar" ? "الحسابات الدائنة - إدارة الفواتير من الموردين" : "Register and manage your purchase invoices."}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="flex h-9 items-center gap-2 rounded-lg border border-input px-4 text-sm font-medium hover:bg-muted"
                    >
                        <Download className="h-4 w-4" />
                        {t("common.export")}
                    </button>
                    <button className="flex h-9 items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 text-sm font-medium text-primary hover:bg-primary/20">
                        <FileText className="h-4 w-4" />
                        {locale === "ar" ? "إنشاء من أمر الشراء" : "Create from PO"}
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        New Purchase
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-5">
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">{locale === "ar" ? "إجمالي الفواتير" : "Total Bills"}</p>
                    <p className="text-2xl font-semibold">{enhancedBills.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">{locale === "ar" ? "بانتظار الموافقة" : "Pending Approval"}</p>
                    <p className="text-2xl font-semibold text-amber-700">{pendingCount}</p>
                </div>
                <div className="rounded-xl border border-border bg-red-50 p-4">
                    <p className="text-sm text-red-700">{locale === "ar" ? "متأخرة" : "Overdue"}</p>
                    <p className="text-2xl font-semibold text-red-700">{overdueCount}</p>
                </div>
                <div className="rounded-xl border border-border bg-blue-50 p-4">
                    <p className="text-sm text-blue-700">{locale === "ar" ? "إجمالي المستحق" : "Total Payable"}</p>
                    <p className="text-2xl font-semibold text-blue-700">{formatCurrency(totalPayable)}</p>
                </div>
                <div className="rounded-xl border border-border bg-purple-50 p-4">
                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <p className="text-sm text-purple-700">{locale === "ar" ? "مستحق هذا الأسبوع" : "Due This Week"}</p>
                    </div>
                    <p className="text-2xl font-semibold text-purple-700">{formatCurrency(thisWeekDue)}</p>
                </div>
            </div>

            {/* Payment Schedule */}
            <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-medium mb-4">{locale === "ar" ? "المدفوعات القادمة" : "Upcoming Payments"}</h3>
                <div className="grid md:grid-cols-3 gap-4">
                    {MOCK_SCHEDULE.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                                <p className="font-medium">{formatDate(payment.dueDate)}</p>
                                <p className="text-sm text-muted-foreground">{locale === "ar" ? "تاريخ الاستحقاق" : "Due Date"}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-primary">{formatCurrency(payment.amount)}</p>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${payment.status === "paid" ? "bg-green-100 text-green-700" :
                                    payment.status === "overdue" ? "bg-red-100 text-red-700" :
                                        "bg-amber-100 text-amber-700"
                                    }`}>
                                    {payment.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={locale === "ar" ? "البحث عن الفواتير..." : "Search bills..."}
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
                    <option value="PENDING">{locale === "ar" ? "معلق" : "Pending"}</option>
                    <option value="APPROVED">{locale === "ar" ? "موافق عليه" : "Approved"}</option>
                    <option value="PARTIAL">{locale === "ar" ? "جزئي" : "Partial"}</option>
                    <option value="PAID">{locale === "ar" ? "مدفوع" : "Paid"}</option>
                    <option value="OVERDUE">{locale === "ar" ? "متأخر" : "Overdue"}</option>
                </select>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{locale === "ar" ? "رقم الفاتورة" : "Bill #"}</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{locale === "ar" ? "المورد" : "Supplier"}</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{locale === "ar" ? "تاريخ الإصدار" : "Issue Date"}</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{locale === "ar" ? "تاريخ الاستحقاق" : "Due Date"}</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{locale === "ar" ? "الحالة" : "Status"}</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">{locale === "ar" ? "المبلغ" : "Amount"}</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">{locale === "ar" ? "الرصيد" : "Balance"}</th>
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
                                    <td className="px-4 py-3"><div className="h-4 w-24 skeleton rounded" /></td>
                                    <td className="px-4 py-3"><div className="h-5 w-20 skeleton rounded-full" /></td>
                                    <td className="px-4 py-3 text-right"><div className="h-4 w-16 skeleton rounded ml-auto" /></td>
                                    <td className="px-4 py-3 text-right"><div className="h-4 w-16 skeleton rounded ml-auto" /></td>
                                    <td className="px-4 py-3 text-right"><div className="h-4 w-20 skeleton rounded ml-auto" /></td>
                                </tr>
                            ))
                        ) : filteredBills.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                                    {locale === "ar" ? "لا توجد فواتير" : "No bills found"}
                                </td>
                            </tr>
                        ) : (
                            filteredBills.map((bill, index) => {
                                const config = statusConfig[bill.status] || statusConfig.DRAFT;
                                const StatusIcon = config.icon;
                                const balance = bill.total - (bill.amountPaid || 0);
                                return (
                                    <motion.tr
                                        key={bill.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-muted/50"
                                    >
                                        <td className="px-4 py-3 font-medium">{bill.billNumber}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-muted-foreground">{bill.supplier.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{formatDate(bill.issueDate)}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{formatDate(bill.dueDate)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}>
                                                <StatusIcon className="h-3 w-3" />
                                                {bill.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(bill.total)}</td>
                                        <td className={`px-4 py-3 text-right font-medium ${balance > 0 ? "text-amber-600" : "text-green-600"}`}>
                                            {formatCurrency(balance)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => {
                                                        setSelectedBill(bill);
                                                        setShowDetailsModal(true);
                                                    }}
                                                    className="p-1.5 hover:bg-muted rounded"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                {balance > 0 && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBill(bill);
                                                            setPaymentAmount(balance.toString());
                                                            setShowPaymentModal(true);
                                                        }}
                                                        className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200 flex items-center gap-1"
                                                    >
                                                        <DollarSign className="h-3 w-3" />
                                                        Pay
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setSelectedBill(bill);
                                                        setShowDebitNoteModal(true);
                                                    }}
                                                    className="p-1.5 hover:bg-muted rounded"
                                                    title="Create Debit Note"
                                                >
                                                    <ArrowRightLeft className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedBill(bill);
                                                        setShowStickerModal(true);
                                                    }}
                                                    className="p-1.5 hover:bg-muted rounded text-primary"
                                                    title={locale === "ar" ? "طباعة ملصقات الباركود" : "Print Barcode Stickers"}
                                                >
                                                    <Tag className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Record Payment Modal */}
            {showPaymentModal && selectedBill && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card rounded-xl p-6 max-w-md w-full mx-4 border border-border"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Record Payment</h2>
                            <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-muted rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Bill</p>
                                <p className="font-medium">{selectedBill.billNumber} - {selectedBill.supplier.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Balance: {formatCurrency(selectedBill.total - (selectedBill.amountPaid || 0))}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Payment Amount</label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Payment Method</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                                >
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="CHECK">Check</option>
                                    <option value="CASH">Cash</option>
                                    <option value="CREDIT_CARD">Credit Card</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Payment Date</label>
                                <input
                                    type="date"
                                    defaultValue={new Date().toISOString().split("T")[0]}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleRecordPayment}
                                className="flex-1 h-10 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
                            >
                                Record Payment
                            </button>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="h-10 px-4 rounded-lg border border-input font-medium hover:bg-muted"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Bill Details Modal */}
            {showDetailsModal && selectedBill && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card rounded-xl p-6 max-w-2xl w-full mx-4 border border-border"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold">{selectedBill.billNumber}</h2>
                                <p className="text-sm text-muted-foreground">{selectedBill.supplier.name}</p>
                            </div>
                            <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-muted rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Issue Date</span>
                                    <span>{formatDate(selectedBill.issueDate)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Due Date</span>
                                    <span>{formatDate(selectedBill.dueDate)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Status</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusConfig[selectedBill.status]?.bg} ${statusConfig[selectedBill.status]?.color}`}>
                                        {selectedBill.status}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total</span>
                                    <span className="font-medium">{formatCurrency(selectedBill.total)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Paid</span>
                                    <span className="text-green-600">{formatCurrency(selectedBill.amountPaid || 0)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-medium">
                                    <span>Balance</span>
                                    <span className="text-amber-600">{formatCurrency(selectedBill.total - (selectedBill.amountPaid || 0))}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6">
                            <h3 className="font-medium mb-3">Line Items</h3>
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Description</th>
                                        <th className="px-3 py-2 text-right">Qty</th>
                                        <th className="px-3 py-2 text-right">Price</th>
                                        <th className="px-3 py-2 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedBill.items?.map((item, i) => (
                                        <tr key={i} className="border-t border-border">
                                            <td className="px-3 py-2">{item.description}</td>
                                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                                            <td className="px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                                            <td className="px-3 py-2 text-right">{formatCurrency(item.quantity * item.unitPrice)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            )}

            {showDebitNoteModal && selectedBill && (
                <PurchaseReturnForm
                    onClose={() => setShowDebitNoteModal(false)}
                    preselectedBillId={selectedBill.id}
                />
            )}

            {/* Barcode Sticker Modal */}
            {showStickerModal && selectedBill && (
                <BarcodeGeneratorModal
                    isOpen={showStickerModal}
                    onClose={() => setShowStickerModal(false)}
                    items={(selectedBill.items || []).map((item, i) => ({
                        id: `${selectedBill.id}-item-${i}`,
                        productName: item.description,
                        sku: `SKU-${selectedBill.billNumber}-${i + 1}`,
                        unitPrice: item.unitPrice,
                        quantity: item.quantity,
                    }))}
                    orderNumber={selectedBill.billNumber}
                />
            )}
            {/* New Bill Modal */}
            {showAddModal && (
                <BillForm
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => setShowAddModal(false)}
                />
            )}
        </div>
    );
}
