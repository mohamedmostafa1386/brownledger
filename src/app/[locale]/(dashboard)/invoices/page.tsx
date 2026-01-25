"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Plus,
    Download,
    Search,
    Mail,
    Bell,
    RefreshCcw,
    Clock,
    FileText,
    X,
    Copy,
    BarChart3,
    CheckCircle2,
    ArrowRightLeft,
    TrendingUp,
    AlertTriangle,
    CreditCard,
    FileCheck,
    DollarSign
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { useI18n } from "@/lib/i18n-context";
import { RegisterPaymentModal } from "@/components/receivables/register-payment-modal";
import { SalesReturnForm } from "@/components/returns/SalesReturnForm";

interface Invoice {
    id: string;
    invoiceNumber: string;
    clientName: string;
    clientEmail?: string;
    issueDate: string;
    dueDate: string;
    status: string;
    total: number;
    isRecurring?: boolean;
    recurringFrequency?: string;
}

const fetchInvoices = async (): Promise<Invoice[]> => {
    const res = await fetch("/api/invoices");
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
};

const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    SENT: "bg-amber-100 text-amber-700",
    PAID: "bg-green-100 text-green-700",
    OVERDUE: "bg-red-100 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-700",
    PARTIAL: "bg-blue-100 text-blue-700",
};


export default function InvoicesPage() {
    const { t, locale } = useI18n();
    const [activeTab, setActiveTab] = useState<"invoices" | "dashboard" | "payments" | "apply">("invoices");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [showRecurringModal, setShowRecurringModal] = useState(false);
    const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const [showPaymentModal, setShowPaymentModal] = useState<"CASH" | "CHECK" | "BANK" | null>(null);
    const [showPaymentPlanModal, setShowPaymentPlanModal] = useState(false);
    const [showStatementModal, setShowStatementModal] = useState(false);

    // Email form state
    const [emailTo, setEmailTo] = useState("");
    const [emailSubject, setEmailSubject] = useState("");
    const [emailMessage, setEmailMessage] = useState("");

    // Recurring form state
    const [recurringFrequency, setRecurringFrequency] = useState("MONTHLY");
    const [recurringStartDate, setRecurringStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [recurringEndDate, setRecurringEndDate] = useState("");

    // Credit note form state
    const [creditReason, setCreditReason] = useState("");
    const [creditAmount, setCreditAmount] = useState(0);

    const queryClient = useQueryClient();

    const { data: invoices = [], isLoading } = useQuery({
        queryKey: ["invoices"],
        queryFn: fetchInvoices,
    });

    const { data: stats } = useQuery({
        queryKey: ["receivables-stats"],
        queryFn: () => fetch("/api/receivables/stats").then((r) => r.json()),
    });

    const { data: payments } = useQuery({
        queryKey: ["payments"],
        queryFn: () => fetch("/api/receivables/payments").then((r) => r.json()),
    });

    const { data: unappliedPayments } = useQuery({
        queryKey: ["unapplied-payments"],
        queryFn: () => fetch("/api/receivables/payments?status=unapplied").then((r) => r.json()),
    });

    const filteredInvoices = Array.isArray(invoices) ? invoices.filter((inv) => {
        const matchesSearch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
            inv.clientName.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
        return matchesSearch && matchesStatus;
    }) : [];

    const openEmailModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setEmailTo(invoice.clientEmail || "");
        setEmailSubject(`Invoice ${invoice.invoiceNumber} from BrownLedger`);
        setEmailMessage(`Dear ${invoice.clientName},\n\nPlease find attached invoice ${invoice.invoiceNumber} for ${formatCurrency(invoice.total)}.\n\nDue date: ${formatDate(invoice.dueDate)}\n\nThank you for your business.`);
        setShowEmailModal(true);
    };

    const handleExport = async () => {
        window.location.href = "/api/invoices/export";
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t("invoices.title")}</h1>
                    <p className="text-sm text-muted-foreground">{locale === "ar" ? "إدارة الفواتير والمدفوعات والمستحقات" : "Manage invoices, payments, and receivables."}</p>
                </div>
                <div className="flex gap-2">
                    {activeTab === "invoices" ? (
                        <>
                            <button
                                onClick={handleExport}
                                className="flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium hover:bg-muted"
                            >
                                <Download className="h-4 w-4" />
                                {t("common.export")}
                            </button>
                            <Link
                                href={`/${locale}/invoices/new`}
                                className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                <Plus className="h-4 w-4" />
                                {t("invoices.newInvoice")}
                            </Link>
                        </>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowPaymentModal("CASH")}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 font-sans"
                            >
                                💵 {t("receivables.registerCash")}
                            </button>
                            <button
                                onClick={() => setShowPaymentModal("CHECK")}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-sans"
                            >
                                🏦 {t("receivables.registerCheck")}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
                <nav className="flex gap-4">
                    {[
                        { id: "invoices", label: t("invoices.title"), icon: FileText },
                        { id: "dashboard", label: locale === "ar" ? "نظرة عامة" : "Receivables Dashboard", icon: BarChart3 },
                        { id: "payments", label: t("receivables.payments"), icon: DollarSign },
                        { id: "apply", label: t("receivables.applyPayments"), icon: CheckCircle2 },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "invoices" && (
                <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="rounded-xl border border-border bg-card p-4">
                            <p className="text-sm text-muted-foreground">{locale === "ar" ? "إجمالي الفواتير" : "Total Invoices"}</p>
                            <p className="text-2xl font-semibold">{invoices.length}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-green-50 p-4">
                            <p className="text-sm text-green-700">{t("invoices.paid")}</p>
                            <p className="text-2xl font-semibold text-green-700">
                                {invoices.filter(inv => inv.status === "PAID").length}
                            </p>
                        </div>
                        <div className="rounded-xl border border-border bg-red-50 p-4">
                            <p className="text-sm text-red-700">{t("invoices.overdue")}</p>
                            <p className="text-2xl font-semibold text-red-700">{invoices.filter(inv => inv.status === "OVERDUE").length}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-purple-50 p-4">
                            <p className="text-sm text-purple-700">{t("invoices.recurring")}</p>
                            <p className="text-2xl font-semibold text-purple-700">{invoices.filter(inv => inv.isRecurring).length}</p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder={locale === "ar" ? "البحث عن الفواتير..." : "Search invoices..."}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                        >
                            <option value="ALL">{locale === "ar" ? "جميع الحالات" : "All Status"}</option>
                            {Object.keys(statusColors).map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                    </div>

                    {/* Table */}
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{locale === "ar" ? "الفاتورة" : "Invoice"}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{locale === "ar" ? "العميل" : "Client"}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{locale === "ar" ? "تاريخ الإصدار" : "Issue Date"}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{locale === "ar" ? "تاريخ الاستحقاق" : "Due Date"}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{locale === "ar" ? "الحالة" : "Status"}</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">{locale === "ar" ? "المبلغ" : "Amount"}</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">{locale === "ar" ? "الإجراءات" : "Actions"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {isLoading ? (
                                    <tr><td colSpan={7} className="p-8 text-center">{locale === "ar" ? "جاري التحميل..." : "Loading..."}</td></tr>
                                ) : filteredInvoices.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{locale === "ar" ? "لا توجد فواتير" : "No invoices found"}</td></tr>
                                ) : (
                                    filteredInvoices.map((invoice) => (
                                        <tr key={invoice.id} className="hover:bg-muted/50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{invoice.invoiceNumber}</span>
                                                    {invoice.isRecurring && <RefreshCcw className="h-3 w-3 text-purple-600" />}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{invoice.clientName}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{formatDate(invoice.issueDate)}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{formatDate(invoice.dueDate)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[invoice.status]}`}>
                                                    {invoice.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(invoice.total)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => openEmailModal(invoice)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded" title={locale === "ar" ? "إرسال بريد" : "Send Email"}><Mail className="h-4 w-4" /></button>
                                                    {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
                                                        <button onClick={() => { setSelectedInvoice(invoice); setShowReminderModal(true); }} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded" title={locale === "ar" ? "إرسال تذكير" : "Send Reminder"}><Bell className="h-4 w-4" /></button>
                                                    )}
                                                    <button onClick={() => { setSelectedInvoice(invoice); setShowRecurringModal(true); }} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded" title={locale === "ar" ? "تعيين متكرر" : "Set Recurring"}><Clock className="h-4 w-4" /></button>
                                                    <button onClick={() => { setSelectedInvoice(invoice); setShowCreditNoteModal(true); }} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded" title={locale === "ar" ? "إنشاء إشعار دائن" : "Create Credit Note"}><ArrowRightLeft className="h-4 w-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === "dashboard" && (
                <div className="space-y-6">
                    {/* Receivables Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="p-6 bg-card rounded-xl border border-border">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-blue-100 rounded-lg"><DollarSign className="w-5 h-5 text-blue-600" /></div>
                                <span className="text-sm text-muted-foreground font-medium">{t("receivables.totalReceivables")}</span>
                            </div>
                            <p className="text-2xl font-bold">{formatCurrency(stats?.totalReceivables || 0)}</p>
                        </div>
                        <div className="p-6 bg-card rounded-xl border border-border">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-orange-100 rounded-lg"><CreditCard className="w-5 h-5 text-orange-600" /></div>
                                <span className="text-sm text-muted-foreground font-medium">{t("receivables.unappliedPayments")}</span>
                            </div>
                            <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats?.unappliedPayments || 0)}</p>
                            <p className="text-sm text-muted-foreground mt-1">{stats?.unappliedCount || 0} {t("receivables.payments")}</p>
                        </div>
                        <div className="p-6 bg-card rounded-xl border border-border">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-purple-100 rounded-lg"><FileCheck className="w-5 h-5 text-purple-600" /></div>
                                <span className="text-sm text-muted-foreground font-medium">{t("receivables.pendingChecks")}</span>
                            </div>
                            <p className="text-2xl font-bold">{formatCurrency(stats?.pendingChecks || 0)}</p>
                        </div>
                        <div className="p-6 bg-card rounded-xl border border-border">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-red-100 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
                                <span className="text-sm text-muted-foreground font-medium">{t("receivables.overdueAmount")}</span>
                            </div>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(stats?.overdueAmount || 0)}</p>
                        </div>
                        <div className="p-6 bg-card rounded-xl border border-border">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-green-100 rounded-lg"><TrendingUp className="w-5 h-5 text-green-600" /></div>
                                <span className="text-sm text-muted-foreground font-medium">{t("receivables.collectedToday")}</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats?.collectedToday || 0)}</p>
                        </div>
                    </div>

                    {/* Aging Chart (Simple representation) */}
                    <div className="bg-card rounded-xl border border-border p-6">
                        <h3 className="font-semibold mb-6 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            {t("receivables.arAging")}
                        </h3>
                        <div className="grid grid-cols-5 gap-4">
                            {[
                                { label: t("receivables.current"), val: stats?.agingCurrent || 25000, color: "bg-green-500" },
                                { label: t("receivables.days1to30"), val: stats?.aging1to30 || 15000, color: "bg-yellow-500" },
                                { label: t("receivables.days31to60"), val: stats?.aging31to60 || 8000, color: "bg-orange-500" },
                                { label: t("receivables.days61to90"), val: stats?.aging61to90 || 5000, color: "bg-red-500" },
                                { label: t("receivables.over90"), val: stats?.agingOver90 || 2000, color: "bg-rose-700" },
                            ].map((aging) => (
                                <div key={aging.label} className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span>{aging.label}</span>
                                        <span>{formatCurrency(aging.val)}</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className={`h-full ${aging.color}`} style={{ width: '70%' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "payments" && (
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">{t("receivables.paymentNumber")}</th>
                                <th className="px-4 py-3 text-left font-medium">{t("receivables.client")}</th>
                                <th className="px-4 py-3 text-left font-medium">{t("receivables.date")}</th>
                                <th className="px-4 py-3 text-left font-medium">{t("receivables.method")}</th>
                                <th className="px-4 py-3 text-left font-medium">{t("receivables.totalAmount")}</th>
                                <th className="px-4 py-3 text-left font-medium">{t("receivables.unapplied")}</th>
                                <th className="px-4 py-3 text-left font-medium">{t("common.status")}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {Array.isArray(payments) && payments.length > 0 ? payments.map((payment: any) => (
                                <tr key={payment.id} className="hover:bg-muted/50">
                                    <td className="px-4 py-3 font-mono">{payment.paymentNumber}</td>
                                    <td className="px-4 py-3">{payment.client?.name || "N/A"}</td>
                                    <td className="px-4 py-3">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${payment.paymentMethod === "CASH" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                                            {payment.paymentMethod}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-semibold">{formatCurrency(payment.totalAmount)}</td>
                                    <td className="px-4 py-3 text-orange-600 font-medium">{formatCurrency(payment.unappliedAmount)}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${payment.status === "APPLIED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">{t("receivables.noPayments")}</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === "apply" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-card rounded-xl border border-border flex flex-col h-[600px]">
                        <div className="p-4 border-b border-border bg-muted/30">
                            <h3 className="font-semibold text-sm">{t("receivables.unappliedPayments")}</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{t("receivables.selectToApply")}</p>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-border">
                            {Array.isArray(unappliedPayments) && unappliedPayments.length > 0 ? unappliedPayments.map((p: any) => (
                                <div key={p.id} className="p-4 hover:bg-muted/50 cursor-pointer transition-colors group">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="font-semibold text-sm group-hover:text-primary transition-colors">{p.client?.name}</p>
                                            <p className="text-xs text-muted-foreground font-mono">{p.paymentNumber}</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="font-bold text-green-600 text-sm">{formatCurrency(p.unappliedAmount)}</p>
                                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{p.paymentMethod}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-12 text-center text-muted-foreground space-y-4">
                                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto opacity-50">
                                        <Search className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm">{t("receivables.noUnappliedPayments")}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-card rounded-xl border border-border flex flex-col h-[600px] bg-muted/5">
                        <div className="p-4 border-b border-border bg-blue-50/50">
                            <h3 className="font-semibold text-sm text-blue-900">{t("receivables.applyToInvoices")}</h3>
                            <p className="text-[10px] text-blue-700/70 uppercase tracking-wider mt-1 font-medium">{t("receivables.selectPaymentFirst")}</p>
                        </div>
                        <div className="flex-1 flex items-center justify-center p-12 text-center text-muted-foreground">
                            <div className="max-w-xs space-y-4">
                                <div className="w-16 h-16 bg-white border border-border rounded-2xl shadow-sm flex items-center justify-center mx-auto">
                                    <ArrowRightLeft className="w-8 h-8 text-primary/30" />
                                </div>
                                <p className="text-sm font-medium leading-relaxed">{t("receivables.selectPaymentToStart")}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showEmailModal && selectedInvoice && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card rounded-2xl shadow-2xl max-w-lg w-full border border-border overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h2 className="text-xl font-bold">Email Invoice</h2>
                            <button onClick={() => setShowEmailModal(false)} className="p-2 hover:bg-muted rounded-full transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5"><label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Recipient</label><input type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} className="w-full h-11 rounded-xl border border-border px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                            <div className="space-y-1.5"><label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Subject</label><input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="w-full h-11 rounded-xl border border-border px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                            <div className="space-y-1.5"><label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Message</label><textarea value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} rows={5} className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" /></div>
                        </div>
                        <div className="p-6 pt-0 flex gap-3"><button className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">Send Invoice</button><button onClick={() => setShowEmailModal(false)} className="h-11 px-6 rounded-xl border border-border font-medium hover:bg-muted transition-colors">Cancel</button></div>
                    </motion.div>
                </div>
            )}

            {showPaymentModal && (
                <RegisterPaymentModal
                    method={showPaymentModal}
                    onClose={() => setShowPaymentModal(null)}
                />
            )}

            {showCreditNoteModal && selectedInvoice && (
                <SalesReturnForm
                    onClose={() => setShowCreditNoteModal(false)}
                    preselectedInvoiceId={selectedInvoice.id}
                />
            )}
        </div>
    );
}



