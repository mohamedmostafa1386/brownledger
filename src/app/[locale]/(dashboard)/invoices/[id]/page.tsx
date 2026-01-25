"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Mail, Printer, Download, CheckCircle, Clock, AlertCircle, FileText, Building2, Calendar, DollarSign } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";

interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    status: string;
    clientName: string;
    clientEmail: string | null;
    clientAddress: string | null;
    subtotal: number;
    taxAmount: number;
    total: number;
    notes: string | null;
    items: InvoiceItem[];
    client?: {
        name: string;
        email: string | null;
        address: string | null;
    };
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
    DRAFT: { color: "text-gray-700", bg: "bg-gray-100", icon: FileText },
    SENT: { color: "text-blue-700", bg: "bg-blue-100", icon: Mail },
    PAID: { color: "text-green-700", bg: "bg-green-100", icon: CheckCircle },
    OVERDUE: { color: "text-red-700", bg: "bg-red-100", icon: AlertCircle },
    PARTIAL: { color: "text-amber-700", bg: "bg-amber-100", icon: Clock },
};

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { locale } = useI18n();
    const invoiceId = params.id as string;

    const { data: invoice, isLoading, error } = useQuery<Invoice>({
        queryKey: ["invoice", invoiceId],
        queryFn: async () => {
            const res = await fetch(`/api/invoices/${invoiceId}`);
            if (!res.ok) throw new Error("Failed to fetch invoice");
            return res.json();
        },
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-9 w-9 skeleton rounded-lg" />
                    <div className="h-8 w-48 skeleton rounded" />
                </div>
                <div className="h-96 skeleton rounded-xl" />
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h2 className="text-xl font-semibold mb-2">{locale === "ar" ? "الفاتورة غير موجودة" : "Invoice Not Found"}</h2>
                <p className="text-muted-foreground mb-4">{locale === "ar" ? "لم نتمكن من العثور على هذه الفاتورة" : "We couldn't find this invoice"}</p>
                <Link href={`/${locale}/invoices`} className="text-primary hover:underline">
                    {locale === "ar" ? "العودة إلى الفواتير" : "Back to Invoices"}
                </Link>
            </div>
        );
    }

    const StatusIcon = statusConfig[invoice.status]?.icon || FileText;
    const statusStyle = statusConfig[invoice.status] || statusConfig.DRAFT;

    // Calculate totals from items if API returns 0 (fallback calculation)
    const calculatedSubtotal = invoice.items?.reduce((sum, item) =>
        sum + ((item.quantity || 0) * (item.unitPrice || 0)), 0) || 0;
    const displaySubtotal = invoice.subtotal || calculatedSubtotal;
    const displayTax = invoice.taxAmount || 0;
    const displayTotal = invoice.total || (displaySubtotal + displayTax);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/${locale}/invoices`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-input hover:bg-muted"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-semibold tracking-tight">{invoice.invoiceNumber}</h1>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.color}`}>
                                <StatusIcon className="w-4 h-4" />
                                {invoice.status}
                            </span>
                        </div>
                        <p className="text-muted-foreground">{invoice.client?.name || invoice.clientName}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="flex h-9 items-center gap-2 rounded-lg border border-input px-4 text-sm font-medium hover:bg-muted">
                        <Printer className="h-4 w-4" />
                        {locale === "ar" ? "طباعة" : "Print"}
                    </button>
                    <button className="flex h-9 items-center gap-2 rounded-lg border border-input px-4 text-sm font-medium hover:bg-muted">
                        <Download className="h-4 w-4" />
                        {locale === "ar" ? "تحميل PDF" : "Download PDF"}
                    </button>
                    <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                        <Mail className="h-4 w-4" />
                        {locale === "ar" ? "إرسال بريد" : "Send Email"}
                    </button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Invoice Details */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 space-y-6"
                >
                    {/* Client & Dates */}
                    <div className="rounded-xl border border-border bg-card p-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    {locale === "ar" ? "معلومات العميل" : "Client Information"}
                                </h3>
                                <p className="font-semibold">{invoice.client?.name || invoice.clientName}</p>
                                {(invoice.client?.email || invoice.clientEmail) && <p className="text-sm text-muted-foreground">{invoice.client?.email || invoice.clientEmail}</p>}
                                {(invoice.client?.address || invoice.clientAddress) && <p className="text-sm text-muted-foreground">{invoice.client?.address || invoice.clientAddress}</p>}
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {locale === "ar" ? "تفاصيل التاريخ" : "Date Details"}
                                </h3>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{locale === "ar" ? "تاريخ الإصدار:" : "Issue Date:"}</span>
                                        <span>{formatDate(invoice.issueDate)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{locale === "ar" ? "تاريخ الاستحقاق:" : "Due Date:"}</span>
                                        <span>{formatDate(invoice.dueDate)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                        <div className="p-4 border-b border-border">
                            <h3 className="font-semibold">{locale === "ar" ? "بنود الفاتورة" : "Invoice Items"}</h3>
                        </div>
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{locale === "ar" ? "الوصف" : "Description"}</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">{locale === "ar" ? "الكمية" : "Qty"}</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">{locale === "ar" ? "سعر الوحدة" : "Unit Price"}</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">{locale === "ar" ? "المجموع" : "Total"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {invoice.items?.length > 0 ? invoice.items.map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3">{item.description}</td>
                                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice || 0)}</td>
                                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.total || item.amount || (item.quantity * item.unitPrice) || 0)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                            {locale === "ar" ? "لا توجد بنود" : "No items"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Notes */}
                    {invoice.notes && (
                        <div className="rounded-xl border border-border bg-card p-6">
                            <h3 className="font-semibold mb-2">{locale === "ar" ? "ملاحظات" : "Notes"}</h3>
                            <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                        </div>
                    )}
                </motion.div>

                {/* Summary Sidebar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="rounded-xl border border-border bg-card p-6 sticky top-24">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" />
                            {locale === "ar" ? "ملخص المبلغ" : "Amount Summary"}
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{locale === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
                                <span>{formatCurrency(displaySubtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{locale === "ar" ? "الضريبة" : "Tax"}</span>
                                <span>{formatCurrency(displayTax)}</span>
                            </div>
                            <div className="border-t border-border pt-3">
                                <div className="flex justify-between text-lg font-semibold">
                                    <span>{locale === "ar" ? "الإجمالي" : "Total"}</span>
                                    <span className="text-primary">{formatCurrency(displayTotal)}</span>
                                </div>
                            </div>
                        </div>

                        {invoice.status !== "PAID" && (
                            <div className="mt-6 space-y-3">
                                <button className="w-full h-10 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700">
                                    {locale === "ar" ? "تسجيل الدفع" : "Record Payment"}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
