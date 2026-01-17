"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n-context";
import { formatCurrency } from "@/lib/format";
import {
    FileText,
    Download,
    Calendar,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle,
    Printer,
    FileSpreadsheet,
} from "lucide-react";

export default function VATReportPage() {
    const { t, locale } = useI18n();
    const currentDate = new Date();
    const [period, setPeriod] = useState("month");
    const [year, setYear] = useState(currentDate.getFullYear());
    const [month, setMonth] = useState(currentDate.getMonth() + 1);

    const { data, isLoading } = useQuery({
        queryKey: ["vat-report", period, year, month],
        queryFn: () =>
            fetch(`/api/reports/vat?period=${period}&year=${year}&month=${month}`).then(r => r.json()),
    });

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">VAT Report</h1>
                    <p className="text-muted-foreground">Value Added Tax summary for Egyptian tax filing</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted">
                        <Printer className="w-4 h-4" />
                        Print
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Period Selector */}
            <div className="bg-card rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Period</label>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="px-3 py-2 border border-border rounded-lg bg-background"
                        >
                            <option value="month">Monthly</option>
                            <option value="quarter">Quarterly</option>
                            <option value="year">Annual</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Year</label>
                        <select
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value))}
                            className="px-3 py-2 border border-border rounded-lg bg-background"
                        >
                            {[2024, 2023, 2022].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                    {period !== "year" && (
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                {period === "quarter" ? "Quarter" : "Month"}
                            </label>
                            <select
                                value={month}
                                onChange={(e) => setMonth(parseInt(e.target.value))}
                                className="px-3 py-2 border border-border rounded-lg bg-background"
                            >
                                {period === "quarter" ? (
                                    [1, 2, 3, 4].map(q => (
                                        <option key={q} value={q * 3}>Q{q}</option>
                                    ))
                                ) : (
                                    months.map((m, i) => (
                                        <option key={i} value={i + 1}>{m}</option>
                                    ))
                                )}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading VAT data...</div>
            ) : data?.error ? (
                <div className="p-8 text-center text-red-500">{data.error}</div>
            ) : (
                <>
                    {/* VAT Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Output VAT */}
                        <div className="bg-card rounded-lg border border-border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-green-600">Output VAT</h3>
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <p className="text-3xl font-bold text-green-600">
                                {formatCurrency(data?.outputVAT?.vatAmount || 0, locale, "EGP")}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                on sales of {formatCurrency(data?.outputVAT?.taxableAmount || 0, locale, "EGP")}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                {data?.outputVAT?.invoiceCount || 0} invoices
                            </p>
                        </div>

                        {/* Input VAT */}
                        <div className="bg-card rounded-lg border border-border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-red-600">Input VAT</h3>
                                <TrendingDown className="w-5 h-5 text-red-600" />
                            </div>
                            <p className="text-3xl font-bold text-red-600">
                                {formatCurrency(data?.inputVAT?.totalVAT || 0, locale, "EGP")}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                on purchases and expenses
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                {(data?.inputVAT?.expenses?.count || 0) + (data?.inputVAT?.bills?.count || 0)} transactions
                            </p>
                        </div>

                        {/* Net VAT */}
                        <div className={`rounded-lg border p-6 ${data?.netVAT?.isPayable ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800" : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"}`}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`font-semibold ${data?.netVAT?.isPayable ? "text-orange-600" : "text-green-600"}`}>
                                    {data?.netVAT?.label || "Net VAT"}
                                </h3>
                                {data?.netVAT?.isPayable ? (
                                    <AlertCircle className="w-5 h-5 text-orange-600" />
                                ) : (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                )}
                            </div>
                            <p className={`text-3xl font-bold ${data?.netVAT?.isPayable ? "text-orange-600" : "text-green-600"}`}>
                                {formatCurrency(data?.netVAT?.amount || 0, locale, "EGP")}
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Filing deadline: {data?.filingDeadline ? new Date(data.filingDeadline).toLocaleDateString() : "N/A"}
                            </p>
                        </div>
                    </div>

                    {/* VAT Calculation Details */}
                    <div className="bg-card rounded-lg border border-border overflow-hidden">
                        <div className="p-4 border-b border-border bg-muted/50">
                            <h2 className="font-semibold">VAT Calculation Details</h2>
                        </div>
                        <table className="w-full">
                            <thead className="bg-muted/30">
                                <tr>
                                    <th className="text-left p-4 font-medium">Description</th>
                                    <th className="text-right p-4 font-medium">Taxable Amount</th>
                                    <th className="text-right p-4 font-medium">VAT @ {data?.vatRate}%</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <tr className="bg-green-50/50 dark:bg-green-900/10">
                                    <td className="p-4 font-medium text-green-600">Output VAT (Sales)</td>
                                    <td className="p-4 text-right">{formatCurrency(data?.outputVAT?.taxableAmount || 0, locale, "EGP")}</td>
                                    <td className="p-4 text-right font-semibold text-green-600">{formatCurrency(data?.outputVAT?.vatAmount || 0, locale, "EGP")}</td>
                                </tr>
                                <tr>
                                    <td className="p-4 ps-8 text-muted-foreground">Expenses</td>
                                    <td className="p-4 text-right text-muted-foreground">{formatCurrency(data?.inputVAT?.expenses?.taxableAmount || 0, locale, "EGP")}</td>
                                    <td className="p-4 text-right text-red-600">({formatCurrency(data?.inputVAT?.expenses?.vatAmount || 0, locale, "EGP")})</td>
                                </tr>
                                <tr>
                                    <td className="p-4 ps-8 text-muted-foreground">Supplier Bills</td>
                                    <td className="p-4 text-right text-muted-foreground">{formatCurrency(data?.inputVAT?.bills?.taxableAmount || 0, locale, "EGP")}</td>
                                    <td className="p-4 text-right text-red-600">({formatCurrency(data?.inputVAT?.bills?.vatAmount || 0, locale, "EGP")})</td>
                                </tr>
                                <tr className="bg-red-50/50 dark:bg-red-900/10">
                                    <td className="p-4 font-medium text-red-600">Total Input VAT</td>
                                    <td className="p-4"></td>
                                    <td className="p-4 text-right font-semibold text-red-600">({formatCurrency(data?.inputVAT?.totalVAT || 0, locale, "EGP")})</td>
                                </tr>
                                <tr className="bg-primary/5 font-bold">
                                    <td className="p-4">{data?.netVAT?.label}</td>
                                    <td className="p-4"></td>
                                    <td className={`p-4 text-right text-lg ${data?.netVAT?.isPayable ? "text-orange-600" : "text-green-600"}`}>
                                        {formatCurrency(data?.netVAT?.amount || 0, locale, "EGP")}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Monthly Breakdown */}
                    {data?.monthlyBreakdown && data.monthlyBreakdown.length > 1 && (
                        <div className="bg-card rounded-lg border border-border overflow-hidden">
                            <div className="p-4 border-b border-border bg-muted/50">
                                <h2 className="font-semibold">Monthly Breakdown</h2>
                            </div>
                            <table className="w-full">
                                <thead className="bg-muted/30">
                                    <tr>
                                        <th className="text-left p-4 font-medium">Month</th>
                                        <th className="text-right p-4 font-medium">Sales</th>
                                        <th className="text-right p-4 font-medium">Output VAT</th>
                                        <th className="text-right p-4 font-medium">Purchases</th>
                                        <th className="text-right p-4 font-medium">Input VAT</th>
                                        <th className="text-right p-4 font-medium">Net VAT</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {data.monthlyBreakdown.map((row: any, i: number) => (
                                        <tr key={i}>
                                            <td className="p-4 font-medium">{row.month}</td>
                                            <td className="p-4 text-right">{formatCurrency(row.sales, locale, "EGP")}</td>
                                            <td className="p-4 text-right text-green-600">{formatCurrency(row.outputVAT, locale, "EGP")}</td>
                                            <td className="p-4 text-right">{formatCurrency(row.purchases, locale, "EGP")}</td>
                                            <td className="p-4 text-right text-red-600">{formatCurrency(row.inputVAT, locale, "EGP")}</td>
                                            <td className={`p-4 text-right font-medium ${row.outputVAT - row.inputVAT >= 0 ? "text-orange-600" : "text-green-600"}`}>
                                                {formatCurrency(row.outputVAT - row.inputVAT, locale, "EGP")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
