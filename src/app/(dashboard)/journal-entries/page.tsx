"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { Plus, RefreshCw, ChevronDown, ChevronRight, RotateCcw, Filter, X, FileText, Upload, Download, Copy } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";

const SOURCE_BADGES: Record<string, { color: string; label: string }> = {
    MANUAL: { color: "bg-gray-100 text-gray-700", label: "Manual" },
    INVOICE: { color: "bg-blue-100 text-blue-700", label: "Invoice" },
    BILL: { color: "bg-orange-100 text-orange-700", label: "Bill" },
    PAYMENT_RECEIVED: { color: "bg-green-100 text-green-700", label: "Payment" },
    PAYMENT_MADE: { color: "bg-red-100 text-red-700", label: "Payment" },
    POS_SALE: { color: "bg-purple-100 text-purple-700", label: "POS" },
    EXPENSE: { color: "bg-yellow-100 text-yellow-700", label: "Expense" },
};

const STATUS_BADGES: Record<string, { color: string }> = {
    DRAFT: { color: "bg-gray-100 text-gray-700" },
    POSTED: { color: "bg-green-100 text-green-700" },
    REVERSED: { color: "bg-red-100 text-red-700" },
};

// Entry Templates
const ENTRY_TEMPLATES = [
    {
        id: "sales",
        name: "Record Sale",
        description: "Cash/AR sale with tax",
        lines: [
            { account: "1100 - Accounts Receivable", debit: true },
            { account: "4000 - Sales Revenue", credit: true },
            { account: "2100 - Sales Tax Payable", credit: true },
        ],
    },
    {
        id: "purchase",
        name: "Record Purchase",
        description: "Inventory purchase on credit",
        lines: [
            { account: "1200 - Inventory", debit: true },
            { account: "2000 - Accounts Payable", credit: true },
        ],
    },
    {
        id: "payroll",
        name: "Payroll Entry",
        description: "Monthly payroll with deductions",
        lines: [
            { account: "5100 - Salaries Expense", debit: true },
            { account: "2200 - Payroll Taxes Payable", credit: true },
            { account: "1001 - Cash", credit: true },
        ],
    },
    {
        id: "depreciation",
        name: "Depreciation",
        description: "Monthly depreciation entry",
        lines: [
            { account: "5200 - Depreciation Expense", debit: true },
            { account: "1510 - Accumulated Depreciation", credit: true },
        ],
    },
    {
        id: "accrual",
        name: "Expense Accrual",
        description: "Accrue unpaid expenses",
        lines: [
            { account: "5XXX - Expense Account", debit: true },
            { account: "2300 - Accrued Expenses", credit: true },
        ],
    },
];

export default function JournalEntriesPage() {
    const t = useTranslations("accounting");
    const tCommon = useTranslations("common");
    const locale = useLocale();
    const queryClient = useQueryClient();
    const [expandedEntries, setExpandedEntries] = useState<string[]>([]);
    const [sourceFilter, setSourceFilter] = useState<string>("");
    const [showNewEntry, setShowNewEntry] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showReversingModal, setShowReversingModal] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [reversingDate, setReversingDate] = useState(new Date().toISOString().split("T")[0]);

    // New entry form state
    const [entryLines, setEntryLines] = useState([
        { account: "", description: "", debit: 0, credit: 0 },
        { account: "", description: "", debit: 0, credit: 0 },
    ]);
    const [entryDescription, setEntryDescription] = useState("");
    const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);

    const { data: entries, isLoading, refetch } = useQuery({
        queryKey: ["journal-entries", sourceFilter],
        queryFn: () => {
            const params = new URLSearchParams();
            if (sourceFilter) params.append("sourceType", sourceFilter);
            return fetch(`/api/journal-entries?${params}`).then((r) => r.json());
        },
    });

    const reverseMutation = useMutation({
        mutationFn: (entryId: string) =>
            fetch("/api/journal-entries", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entryId }),
            }).then((r) => r.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
        },
    });

    const createReversingMutation = useMutation({
        mutationFn: (data: { entryId: string; reversingDate: string }) =>
            fetch("/api/journal-entries/reversing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }).then((r) => r.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
            setShowReversingModal(false);
            setSelectedEntry(null);
        },
    });

    const toggleExpand = (id: string) => {
        setExpandedEntries((prev) =>
            prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
        );
    };

    const applyTemplate = (template: typeof ENTRY_TEMPLATES[0]) => {
        setEntryLines(template.lines.map(line => ({
            account: line.account,
            description: "",
            debit: line.debit ? 0 : 0,
            credit: line.credit ? 0 : 0,
        })));
        setEntryDescription(template.description);
        setShowTemplates(false);
        setShowNewEntry(true);
    };

    const addLine = () => {
        setEntryLines([...entryLines, { account: "", description: "", debit: 0, credit: 0 }]);
    };

    const removeLine = (index: number) => {
        if (entryLines.length > 2) {
            setEntryLines(entryLines.filter((_, i) => i !== index));
        }
    };

    const totalDebit = entryLines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = entryLines.reduce((sum, line) => sum + (line.credit || 0), 0);
    const isBalanced = totalDebit === totalCredit && totalDebit > 0;

    const openReversingModal = (entry: any) => {
        setSelectedEntry(entry);
        setShowReversingModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t("journalEntries")}</h1>
                    <p className="text-sm text-muted-foreground">{t("journalSubtitle")}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowTemplates(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
                    >
                        <FileText className="w-4 h-4" />
                        Templates
                    </button>
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
                    >
                        <RefreshCw className="w-4 h-4" />
                        {tCommon("refresh")}
                    </button>
                    <button
                        onClick={() => setShowNewEntry(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                        <Plus className="w-4 h-4" />
                        {t("newEntry")}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        className="px-3 py-2 text-sm border border-border rounded-lg bg-background"
                    >
                        <option value="">{t("allSources")}</option>
                        <option value="MANUAL">{t("manual")}</option>
                        <option value="INVOICE">{t("invoice")}</option>
                        <option value="BILL">{t("bill")}</option>
                        <option value="PAYMENT_RECEIVED">{t("paymentReceived")}</option>
                        <option value="POS_SALE">{t("posSale")}</option>
                    </select>
                </div>
                <div className="flex gap-2 ml-auto">
                    <button className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted">
                        <Upload className="w-4 h-4" />
                        Import
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Entries List */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">{tCommon("loading")}</div>
                ) : !entries || entries.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">{t("noEntries")}</div>
                ) : (
                    <div className="divide-y divide-border">
                        {entries.map((entry: any) => {
                            const isExpanded = expandedEntries.includes(entry.id);
                            const source = SOURCE_BADGES[entry.sourceType] || SOURCE_BADGES.MANUAL;
                            const status = STATUS_BADGES[entry.status] || STATUS_BADGES.DRAFT;

                            return (
                                <div key={entry.id}>
                                    <button
                                        onClick={() => toggleExpand(entry.id)}
                                        className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        {isExpanded ? (
                                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                        )}
                                        <span className="font-mono text-sm w-32">{entry.journalNumber}</span>
                                        <span className="text-sm text-muted-foreground w-24">
                                            {formatDate(entry.entryDate, locale)}
                                        </span>
                                        <span className={`px-2 py-1 text-xs rounded ${source.color}`}>
                                            {source.label}
                                        </span>
                                        <span className="flex-1 text-start truncate">{entry.description}</span>
                                        <span className="font-mono text-sm w-28 text-end">
                                            {formatCurrency(entry.totalDebit, locale, "EGP")}
                                        </span>
                                        <span className={`px-2 py-1 text-xs rounded ${status.color}`}>
                                            {entry.status}
                                        </span>
                                    </button>

                                    {isExpanded && (
                                        <div className="bg-muted/30 px-12 py-4">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-xs text-muted-foreground uppercase">
                                                        <th className="px-4 py-2 text-start">{t("account")}</th>
                                                        <th className="px-4 py-2 text-start">{t("description")}</th>
                                                        <th className="px-4 py-2 text-end">{t("debit")}</th>
                                                        <th className="px-4 py-2 text-end">{t("credit")}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {entry.lines.map((line: any) => (
                                                        <tr key={line.id} className="border-t border-border">
                                                            <td className="px-4 py-2">
                                                                <span className="font-mono">{line.account.accountCode}</span>
                                                                <span className="ms-2">{line.account.accountName}</span>
                                                            </td>
                                                            <td className="px-4 py-2 text-muted-foreground">
                                                                {line.description}
                                                            </td>
                                                            <td className="px-4 py-2 text-end">
                                                                {line.debit > 0 ? formatCurrency(line.debit, locale, "EGP") : ""}
                                                            </td>
                                                            <td className="px-4 py-2 text-end">
                                                                {line.credit > 0 ? formatCurrency(line.credit, locale, "EGP") : ""}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="font-bold border-t border-border">
                                                    <tr>
                                                        <td className="px-4 py-2" colSpan={2}>{t("total")}</td>
                                                        <td className="px-4 py-2 text-end">
                                                            {formatCurrency(entry.totalDebit, locale, "EGP")}
                                                        </td>
                                                        <td className="px-4 py-2 text-end">
                                                            {formatCurrency(entry.totalCredit, locale, "EGP")}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>

                                            {entry.status === "POSTED" && (
                                                <div className="mt-4 flex justify-end gap-2">
                                                    <button
                                                        onClick={() => openReversingModal(entry)}
                                                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                        Create Reversing Entry
                                                    </button>
                                                    <button
                                                        onClick={() => reverseMutation.mutate(entry.id)}
                                                        disabled={reverseMutation.isPending}
                                                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                        {t("reverseEntry")}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Templates Modal */}
            {showTemplates && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl p-6 max-w-lg w-full mx-4 border border-border">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Entry Templates</h2>
                            <button onClick={() => setShowTemplates(false)} className="p-1 hover:bg-muted rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {ENTRY_TEMPLATES.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => applyTemplate(template)}
                                    className="w-full p-4 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="font-medium">{template.name}</div>
                                    <div className="text-sm text-muted-foreground">{template.description}</div>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {template.lines.map((line, i) => (
                                            <span key={i} className="px-2 py-0.5 text-xs bg-muted rounded">
                                                {line.account.split(" - ")[1] || line.account}
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* New Entry Modal */}
            {showNewEntry && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl p-6 max-w-3xl w-full mx-4 border border-border max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">New Journal Entry</h2>
                            <button onClick={() => setShowNewEntry(false)} className="p-1 hover:bg-muted rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Date</label>
                                    <input
                                        type="date"
                                        value={entryDate}
                                        onChange={(e) => setEntryDate(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Description</label>
                                    <input
                                        type="text"
                                        value={entryDescription}
                                        onChange={(e) => setEntryDescription(e.target.value)}
                                        placeholder="Entry description..."
                                        className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Entry Lines</label>
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Account</th>
                                            <th className="px-3 py-2 text-left">Description</th>
                                            <th className="px-3 py-2 text-right w-32">Debit</th>
                                            <th className="px-3 py-2 text-right w-32">Credit</th>
                                            <th className="px-3 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entryLines.map((line, i) => (
                                            <tr key={i} className="border-t border-border">
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={line.account}
                                                        onChange={(e) => {
                                                            const newLines = [...entryLines];
                                                            newLines[i].account = e.target.value;
                                                            setEntryLines(newLines);
                                                        }}
                                                        placeholder="Account code or name"
                                                        className="w-full h-8 rounded border border-input bg-background px-2 text-sm"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={line.description}
                                                        onChange={(e) => {
                                                            const newLines = [...entryLines];
                                                            newLines[i].description = e.target.value;
                                                            setEntryLines(newLines);
                                                        }}
                                                        placeholder="Line description"
                                                        className="w-full h-8 rounded border border-input bg-background px-2 text-sm"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={line.debit || ""}
                                                        onChange={(e) => {
                                                            const newLines = [...entryLines];
                                                            newLines[i].debit = parseFloat(e.target.value) || 0;
                                                            newLines[i].credit = 0;
                                                            setEntryLines(newLines);
                                                        }}
                                                        className="w-full h-8 rounded border border-input bg-background px-2 text-sm text-right"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        value={line.credit || ""}
                                                        onChange={(e) => {
                                                            const newLines = [...entryLines];
                                                            newLines[i].credit = parseFloat(e.target.value) || 0;
                                                            newLines[i].debit = 0;
                                                            setEntryLines(newLines);
                                                        }}
                                                        className="w-full h-8 rounded border border-input bg-background px-2 text-sm text-right"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    {entryLines.length > 2 && (
                                                        <button onClick={() => removeLine(i)} className="text-red-500 hover:text-red-700">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-muted/50 font-medium">
                                        <tr>
                                            <td colSpan={2} className="px-3 py-2">
                                                <button onClick={addLine} className="text-primary text-sm hover:underline">
                                                    + Add Line
                                                </button>
                                            </td>
                                            <td className="px-3 py-2 text-right">{formatCurrency(totalDebit, locale, "EGP")}</td>
                                            <td className="px-3 py-2 text-right">{formatCurrency(totalCredit, locale, "EGP")}</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>

                                {!isBalanced && totalDebit > 0 && (
                                    <p className="text-sm text-red-600 mt-2">
                                        ⚠️ Entry is not balanced. Difference: {formatCurrency(Math.abs(totalDebit - totalCredit), locale, "EGP")}
                                    </p>
                                )}
                                {isBalanced && (
                                    <p className="text-sm text-green-600 mt-2">
                                        ✓ Entry is balanced
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                disabled={!isBalanced}
                                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
                            >
                                Save as Draft
                            </button>
                            <button
                                disabled={!isBalanced}
                                className="flex-1 h-10 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50"
                            >
                                Post Entry
                            </button>
                            <button
                                onClick={() => setShowNewEntry(false)}
                                className="h-10 px-4 rounded-lg border border-input font-medium hover:bg-muted"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reversing Entry Modal */}
            {showReversingModal && selectedEntry && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4 border border-border">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Create Reversing Entry</h2>
                            <button onClick={() => setShowReversingModal(false)} className="p-1 hover:bg-muted rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">Original Entry:</p>
                                <p className="font-medium">{selectedEntry.journalNumber}</p>
                                <p className="text-sm">{selectedEntry.description}</p>
                                <p className="text-sm font-medium mt-2">
                                    Amount: {formatCurrency(selectedEntry.totalDebit, locale, "EGP")}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Reversing Entry Date</label>
                                <input
                                    type="date"
                                    value={reversingDate}
                                    onChange={(e) => setReversingDate(e.target.value)}
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Typically the first day of the next period
                                </p>
                            </div>

                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <p className="text-sm text-orange-800">
                                    This will create a new entry with debits and credits swapped,
                                    effectively reversing the original transaction.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => createReversingMutation.mutate({
                                    entryId: selectedEntry.id,
                                    reversingDate
                                })}
                                disabled={createReversingMutation.isPending}
                                className="flex-1 h-10 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 disabled:opacity-50"
                            >
                                {createReversingMutation.isPending ? "Creating..." : "Create Reversing Entry"}
                            </button>
                            <button
                                onClick={() => setShowReversingModal(false)}
                                className="h-10 px-4 rounded-lg border border-input font-medium hover:bg-muted"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
