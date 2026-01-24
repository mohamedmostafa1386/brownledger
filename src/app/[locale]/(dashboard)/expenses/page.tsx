"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Camera, Sparkles, TrendingUp, TrendingDown, Calendar, BarChart3, Download, Receipt, Tag, Repeat, X, Edit2, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AddExpenseModal } from "@/components/expenses/add-expense-modal";
import { ReceiptOCR } from "@/components/expenses/receipt-ocr";
import { useI18n } from "@/lib/i18n-context";

interface Expense {
    id: string;
    date: string;
    vendor: string;
    description: string;
    category: string;
    amount: number;
    isRecurring?: boolean;
    receiptUrl?: string;
    tags?: string[];
    status?: "pending" | "approved" | "rejected";
}

const fetchExpenses = async (): Promise<Expense[]> => {
    const res = await fetch("/api/expenses");
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
};

const CATEGORY_COLORS: Record<string, string> = {
    "Office Supplies": "bg-blue-100 text-blue-700",
    "Travel": "bg-purple-100 text-purple-700",
    "Utilities": "bg-amber-100 text-amber-700",
    "Marketing": "bg-pink-100 text-pink-700",
    "Equipment": "bg-green-100 text-green-700",
    "Services": "bg-indigo-100 text-indigo-700",
    "Other": "bg-gray-100 text-gray-700",
};

const COMMON_TAGS = ["Tax Deductible", "Billable", "Personal", "Urgent", "Recurring"];

export default function ExpensesPage() {
    const { t, locale } = useI18n();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [dateRange, setDateRange] = useState<"week" | "month" | "quarter" | "year">("month");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showOCR, setShowOCR] = useState(false);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [showRecurringModal, setShowRecurringModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [ocrData, setOcrData] = useState<{
        vendor?: string;
        date?: string;
        amount?: number;
        description?: string;
    } | null>(null);

    // Budget settings
    const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({
        "Office Supplies": 5000,
        "Travel": 10000,
        "Utilities": 3000,
        "Marketing": 15000,
    });

    const { data: expenses = [], isLoading } = useQuery({
        queryKey: ["expenses"],
        queryFn: fetchExpenses,
    });

    // Enhance expenses with mock additional fields
    const enhancedExpenses = expenses.map((exp, i) => ({
        ...exp,
        isRecurring: i % 5 === 0,
        tags: i % 3 === 0 ? ["Tax Deductible"] : i % 4 === 0 ? ["Billable"] : [],
        status: i % 7 === 0 ? "pending" : "approved" as const,
    }));

    // Get unique categories
    const categories = [...new Set(enhancedExpenses.map((e) => e.category))];

    const filteredExpenses = enhancedExpenses.filter((exp) => {
        const matchesSearch = exp.vendor.toLowerCase().includes(search.toLowerCase()) ||
            exp.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = categoryFilter === "ALL" || exp.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const recurringTotal = enhancedExpenses.filter(e => e.isRecurring).reduce((sum, e) => sum + e.amount, 0);
    const pendingApproval = enhancedExpenses.filter(e => e.status === "pending").length;

    // Calculate category totals for budget comparison
    const categoryTotals = categories.reduce((acc, cat) => {
        acc[cat] = enhancedExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
        return acc;
    }, {} as Record<string, number>);

    const handleOCRComplete = (data: {
        vendor: string;
        date: string;
        amount: number;
        items?: { description: string }[];
    }) => {
        setShowOCR(false);
        setOcrData({
            vendor: data.vendor,
            date: data.date,
            amount: data.amount,
            description: data.items?.map(i => i.description).join(", ") || data.vendor,
        });
        setShowAddModal(true);
    };

    const handleExport = () => {
        const csv = enhancedExpenses.map(e =>
            `${e.date},${e.vendor},${e.description},${e.category},${e.amount}`
        ).join("\n");
        const blob = new Blob([`Date,Vendor,Description,Category,Amount\n${csv}`], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "expenses.csv";
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">{t("expenses.title")}</h1>
                    <p className="text-muted-foreground">{locale === "ar" ? "تتبع وتصنيف مصروفات عملك" : "Track and categorize your business expenses."}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="flex h-9 items-center gap-2 rounded-lg border border-input px-4 text-sm font-medium hover:bg-muted"
                    >
                        <Download className="h-4 w-4" />
                        {t("common.export")}
                    </button>
                    <button
                        onClick={() => setShowBudgetModal(true)}
                        className="flex h-9 items-center gap-2 rounded-lg border border-input px-4 text-sm font-medium hover:bg-muted"
                    >
                        <BarChart3 className="h-4 w-4" />
                        {t("expenses.budgets")}
                    </button>
                    <button
                        onClick={() => setShowOCR(true)}
                        className="flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium hover:bg-muted"
                    >
                        <Camera className="h-4 w-4" />
                        <Sparkles className="h-3 w-3 text-primary" />
                        {t("expenses.scanReceipt")}
                    </button>
                    <button
                        onClick={() => {
                            setOcrData(null);
                            setShowAddModal(true);
                        }}
                        className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        {t("expenses.addExpense")}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-5">
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">{locale === "ar" ? "إجمالي المصروفات" : "Total Expenses"}</p>
                    <p className="text-2xl font-semibold text-destructive">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">{locale === "ar" ? "هذا الشهر" : "This Month"}</p>
                    <p className="text-2xl font-semibold">{filteredExpenses.length}</p>
                    <p className="text-xs text-muted-foreground">{locale === "ar" ? "معاملة" : "transactions"}</p>
                </div>
                <div className="rounded-xl border border-border bg-purple-50 p-4">
                    <div className="flex items-center gap-1">
                        <Repeat className="h-4 w-4 text-purple-600" />
                        <p className="text-sm text-purple-700">{locale === "ar" ? "متكرر" : "Recurring"}</p>
                    </div>
                    <p className="text-2xl font-semibold text-purple-700">{formatCurrency(recurringTotal)}</p>
                </div>
                <div className="rounded-xl border border-border bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">{locale === "ar" ? "بانتظار الموافقة" : "Pending Approval"}</p>
                    <p className="text-2xl font-semibold text-amber-700">{pendingApproval}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <p className="text-sm text-muted-foreground">{locale === "ar" ? "متوسط المعاملة" : "Avg. per Transaction"}</p>
                    <p className="text-2xl font-semibold">
                        {formatCurrency(filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0)}
                    </p>
                </div>
            </div>

            {/* Category Budget Progress */}
            <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="font-medium mb-4">{locale === "ar" ? "ميزانيات الفئات" : "Category Budgets"}</h3>
                <div className="grid md:grid-cols-4 gap-4">
                    {Object.entries(categoryBudgets).map(([cat, budget]) => {
                        const spent = categoryTotals[cat] || 0;
                        const percentage = Math.min((spent / budget) * 100, 100);
                        const isOverBudget = spent > budget;
                        return (
                            <div key={cat} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>{cat}</span>
                                    <span className={isOverBudget ? "text-red-600 font-medium" : ""}>
                                        {formatCurrency(spent)} / {formatCurrency(budget)}
                                    </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${isOverBudget ? "bg-red-500" : "bg-primary"}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={locale === "ar" ? "البحث عن المصروفات..." : "Search expenses..."}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    <option value="ALL">{locale === "ar" ? "جميع الفئات" : "All Categories"}</option>
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
                <div className="flex border border-border rounded-lg overflow-hidden">
                    {(["week", "month", "quarter", "year"] as const).map(range => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className={`px-3 py-1.5 text-sm capitalize ${dateRange === range ? "bg-muted font-medium" : ""}`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Vendor</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Category</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tags</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-3"><div className="h-4 w-24 skeleton rounded" /></td>
                                    <td className="px-4 py-3"><div className="h-4 w-28 skeleton rounded" /></td>
                                    <td className="px-4 py-3"><div className="h-4 w-40 skeleton rounded" /></td>
                                    <td className="px-4 py-3"><div className="h-5 w-20 skeleton rounded-full" /></td>
                                    <td className="px-4 py-3"><div className="h-5 w-16 skeleton rounded-full" /></td>
                                    <td className="px-4 py-3 text-right"><div className="h-4 w-16 skeleton rounded ml-auto" /></td>
                                    <td className="px-4 py-3"><div className="h-4 w-16 skeleton rounded ml-auto" /></td>
                                </tr>
                            ))
                        ) : filteredExpenses.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                    {locale === "ar" ? "لا توجد مصروفات" : "No expenses found"}
                                </td>
                            </tr>
                        ) : (
                            filteredExpenses.map((expense, index) => (
                                <motion.tr
                                    key={expense.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="hover:bg-muted/50"
                                >
                                    <td className="px-4 py-3 text-muted-foreground">{formatDate(expense.date)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{expense.vendor}</span>
                                            {expense.isRecurring && (
                                                <Repeat className="h-3 w-3 text-purple-600" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{expense.description}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other}`}>
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            {expense.tags?.map(tag => (
                                                <span key={tag} className="px-2 py-0.5 bg-muted text-xs rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-destructive">
                                        -{formatCurrency(expense.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <button className="p-1 hover:bg-muted rounded">
                                                <Receipt className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                            <button className="p-1 hover:bg-muted rounded">
                                                <Edit2 className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            <AddExpenseModal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setOcrData(null);
                }}
                initialData={ocrData || undefined}
            />

            {showOCR && (
                <ReceiptOCR
                    onComplete={handleOCRComplete}
                    onCancel={() => setShowOCR(false)}
                />
            )}

            {/* Budget Settings Modal */}
            {showBudgetModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card rounded-xl p-6 max-w-md w-full mx-4 border border-border"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">{locale === "ar" ? "ميزانيات الفئات" : "Category Budgets"}</h2>
                            <button onClick={() => setShowBudgetModal(false)} className="p-1 hover:bg-muted rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {Object.entries(categoryBudgets).map(([cat, budget]) => (
                                <div key={cat} className="flex items-center gap-3">
                                    <span className="flex-1 text-sm">{cat}</span>
                                    <input
                                        type="number"
                                        value={budget}
                                        onChange={(e) => setCategoryBudgets({
                                            ...categoryBudgets,
                                            [cat]: parseFloat(e.target.value) || 0
                                        })}
                                        className="w-28 h-9 rounded-lg border border-input px-3 text-sm text-right"
                                    />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowBudgetModal(false)}
                            className="w-full h-10 mt-6 rounded-lg bg-primary text-primary-foreground font-medium"
                        >
                            {locale === "ar" ? "حفظ الميزانيات" : "Save Budgets"}
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
