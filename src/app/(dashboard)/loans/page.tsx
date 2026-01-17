"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Plus,
    Search,
    Calendar,
    TrendingUp,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    MoreHorizontal,
    FileText,
    CreditCard,
    ChevronRight
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import { AddLoanModal } from "@/components/accounting/AddLoanModal";
import { LoanSchedule } from "@/components/accounting/LoanSchedule";
import { LoanPaymentModal } from "@/components/accounting/LoanPaymentModal";

interface Loan {
    id: string;
    loanName: string;
    lenderName: string;
    referenceNumber: string | null;
    principalAmount: number;
    interestRate: number;
    interestType: string;
    startDate: string;
    endDate: string;
    termMonths: number;
    paymentFrequency: string;
    monthlyPayment: number | null;
    totalInterest: number | null;
    totalPaid: number;
    principalPaid: number;
    interestPaid: number;
    remainingBalance: number;
    isActive: boolean;
}

const fetchLoans = async () => {
    const res = await fetch("/api/loans");
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
};

export default function LoansPage() {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
    const [paymentLoanId, setPaymentLoanId] = useState<string | null>(null);

    const { data: loansData, isLoading } = useQuery<{ loans: Loan[] }>({
        queryKey: ["loans"],
        queryFn: fetchLoans,
    });

    const loans = loansData?.loans || [];

    const filteredLoans = loans.filter((loan) =>
        loan.loanName.toLowerCase().includes(search.toLowerCase()) ||
        loan.lenderName.toLowerCase().includes(search.toLowerCase())
    );

    const totalBorrowed = loans.reduce((sum, l) => sum + l.principalAmount, 0);
    const totalRemaining = loans.reduce((sum, l) => sum + l.remainingBalance, 0);
    const activeLoansCount = loans.filter(l => l.isActive).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">{t("loans.title")}</h1>
                    <p className="text-muted-foreground">{t("loans.subtitle")}</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    <Plus className="h-4 w-4" />
                    {t("loans.newLoan")}
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <TrendingUp className="h-4 w-4" />
                        <p className="text-sm font-medium">Total Borrowed</p>
                    </div>
                    <p className="text-2xl font-semibold">{formatCurrency(totalBorrowed)}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <CreditCard className="h-4 w-4" />
                        <p className="text-sm font-medium">{t("loans.remaining")}</p>
                    </div>
                    <p className="text-2xl font-semibold text-destructive">{formatCurrency(totalRemaining)}</p>
                </div>
                <div className="rounded-xl border border-border bg-blue-50 p-4">
                    <div className="flex items-center gap-2 text-blue-700 mb-1">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm font-medium">Active Loans</p>
                    </div>
                    <p className="text-2xl font-semibold text-blue-700">{activeLoansCount}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <CheckCircle2 className="h-4 w-4" />
                        <p className="text-sm font-medium">Interest Paid</p>
                    </div>
                    <p className="text-2xl font-semibold text-green-600">
                        {formatCurrency(loans.reduce((sum, l) => sum + l.interestPaid, 0))}
                    </p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder={t("common.search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 w-full max-w-md rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>

            {/* Loans Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium">{t("loans.title")}</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">{t("loans.lender")}</th>
                            <th className="px-4 py-3 text-center text-sm font-medium">{t("loans.interestRate")}</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">{t("loans.monthlyPayment")}</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">{t("loans.remaining")}</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">{t("loans.principal")}</th>
                            <th className="px-4 py-3 text-right text-sm font-medium">{t("common.actions")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={7} className="px-4 py-4 h-12 bg-muted/20" />
                                </tr>
                            ))
                        ) : filteredLoans.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                    {t("loans.noLoans")}
                                </td>
                            </tr>
                        ) : (
                            filteredLoans.map((loan) => (
                                <tr key={loan.id} className={`hover:bg-muted/50 group transition-colors ${!loan.isActive ? "opacity-60" : ""}`}>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{loan.loanName}</span>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                <span>{formatDate(loan.startDate)}</span>
                                                <ChevronRight className="h-2 w-2 mx-0.5" />
                                                <span>{formatDate(loan.endDate)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm">
                                        <div className="flex flex-col">
                                            <span>{loan.lenderName}</span>
                                            {loan.referenceNumber && <span className="text-xs text-muted-foreground">Ref: {loan.referenceNumber}</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center text-sm font-medium">
                                        {(loan.interestRate * 100).toFixed(1)}%
                                        <span className="ml-1 text-[10px] text-muted-foreground block text-center uppercase tracking-tighter">
                                            {loan.interestType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm font-medium">
                                        {loan.monthlyPayment ? formatCurrency(loan.monthlyPayment) : "-"}
                                        <span className="text-[10px] text-muted-foreground block text-right uppercase tracking-tighter">
                                            {loan.paymentFrequency}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-medium text-destructive">
                                                {formatCurrency(loan.remainingBalance)}
                                            </span>
                                            <div className="w-20 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-destructive"
                                                    style={{ width: `${(loan.remainingBalance / loan.principalAmount) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm font-medium">
                                        {formatCurrency(loan.principalAmount)}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setPaymentLoanId(loan.id)}
                                                disabled={!loan.isActive}
                                                className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                            >
                                                <CreditCard className="h-3.5 w-3.5" />
                                                {t("loans.repay")}
                                            </button>
                                            <button
                                                onClick={() => setSelectedLoanId(loan.id)}
                                                className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors"
                                                title={t("loans.schedule")}
                                            >
                                                <FileText className="h-4 w-4" />
                                            </button>
                                            <button className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {showAddModal && (
                <AddLoanModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                />
            )}

            {selectedLoanId && (
                <LoanSchedule
                    loanId={selectedLoanId}
                    onClose={() => setSelectedLoanId(null)}
                />
            )}

            {paymentLoanId && (
                <LoanPaymentModal
                    loanId={paymentLoanId}
                    onClose={() => setPaymentLoanId(null)}
                />
            )}
        </div>
    );
}
