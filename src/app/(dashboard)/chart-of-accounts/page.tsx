"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { ChevronRight, ChevronDown, Plus, Edit2, Trash2, DollarSign, Building2, TrendingUp, Receipt, Folder, Upload, Download, X, FileText, Copy } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface Account {
    id: string;
    accountCode: string;
    accountName: string;
    accountNameAr?: string;
    accountNameFr?: string;
    accountType: string;
    accountCategory: string;
    normalBalance: string;
    currentBalance: number;
    isActive: boolean;
    parentId?: string;
    children?: Account[];
    level?: number;
}

const TYPE_ICONS: Record<string, any> = {
    ASSET: DollarSign,
    LIABILITY: Building2,
    EQUITY: TrendingUp,
    REVENUE: Receipt,
    EXPENSE: Folder,
};

const TYPE_COLORS: Record<string, string> = {
    ASSET: "text-blue-600 bg-blue-100",
    LIABILITY: "text-red-600 bg-red-100",
    EQUITY: "text-green-600 bg-green-100",
    REVENUE: "text-purple-600 bg-purple-100",
    EXPENSE: "text-orange-600 bg-orange-100",
};

// Account Templates
const ACCOUNT_TEMPLATES = [
    {
        id: "standard",
        name: "Standard Business",
        description: "Full chart of accounts for small to medium businesses",
        accountCount: 45,
    },
    {
        id: "retail",
        name: "Retail Business",
        description: "Optimized for retail and inventory-based businesses",
        accountCount: 52,
    },
    {
        id: "service",
        name: "Service Company",
        description: "Simplified accounts for service-based businesses",
        accountCount: 32,
    },
    {
        id: "manufacturing",
        name: "Manufacturing",
        description: "Includes WIP, raw materials, and production accounts",
        accountCount: 68,
    },
];

const CATEGORY_OPTIONS: Record<string, string[]> = {
    ASSET: ["CURRENT_ASSET", "FIXED_ASSET", "OTHER_ASSET", "BANK", "CASH"],
    LIABILITY: ["CURRENT_LIABILITY", "LONG_TERM_LIABILITY", "OTHER_LIABILITY"],
    EQUITY: ["OWNER_EQUITY", "RETAINED_EARNINGS", "SHARE_CAPITAL"],
    REVENUE: ["OPERATING_REVENUE", "OTHER_REVENUE"],
    EXPENSE: ["COST_OF_GOODS_SOLD", "OPERATING_EXPENSE", "OTHER_EXPENSE"],
};

export default function ChartOfAccountsPage() {
    const t = useTranslations("accounting");
    const tCommon = useTranslations("common");
    const locale = useLocale();
    const queryClient = useQueryClient();
    const [expandedTypes, setExpandedTypes] = useState<string[]>(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]);
    const [expandedAccounts, setExpandedAccounts] = useState<string[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [viewMode, setViewMode] = useState<"flat" | "hierarchy">("hierarchy");

    // Add account form state
    const [newAccountCode, setNewAccountCode] = useState("");
    const [newAccountName, setNewAccountName] = useState("");
    const [newAccountType, setNewAccountType] = useState("ASSET");
    const [newAccountCategory, setNewAccountCategory] = useState("");
    const [newAccountParent, setNewAccountParent] = useState("");
    const [newNormalBalance, setNewNormalBalance] = useState("DEBIT");

    const { data: accounts, isLoading } = useQuery<Account[]>({
        queryKey: ["accounts"],
        queryFn: () => fetch("/api/accounts").then((r) => r.json()),
    });

    const seedMutation = useMutation({
        mutationFn: () =>
            fetch("/api/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ seedDefaults: true }),
            }).then((r) => r.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
        },
    });

    const createAccountMutation = useMutation({
        mutationFn: (data: any) =>
            fetch("/api/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            }).then((r) => r.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            setShowAddModal(false);
            resetForm();
        },
    });

    const applyTemplateMutation = useMutation({
        mutationFn: (templateId: string) =>
            fetch("/api/accounts/template", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ templateId }),
            }).then((r) => r.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
            setShowTemplatesModal(false);
        },
    });

    const resetForm = () => {
        setNewAccountCode("");
        setNewAccountName("");
        setNewAccountType("ASSET");
        setNewAccountCategory("");
        setNewAccountParent("");
        setNewNormalBalance("DEBIT");
    };

    // Build hierarchical structure
    const buildHierarchy = (accounts: Account[]): Account[] => {
        const accountMap = new Map<string, Account>();
        const roots: Account[] = [];

        accounts.forEach(acc => {
            accountMap.set(acc.id, { ...acc, children: [], level: 0 });
        });

        accounts.forEach(acc => {
            const account = accountMap.get(acc.id)!;
            if (acc.parentId && accountMap.has(acc.parentId)) {
                const parent = accountMap.get(acc.parentId)!;
                parent.children = parent.children || [];
                parent.children.push(account);
                account.level = (parent.level || 0) + 1;
            } else {
                roots.push(account);
            }
        });

        return roots;
    };

    // Group accounts by type
    const groupedAccounts = (accounts || []).reduce((acc, account) => {
        if (!acc[account.accountType]) acc[account.accountType] = [];
        acc[account.accountType].push(account);
        return acc;
    }, {} as Record<string, Account[]>);

    // Hierarchical grouped accounts
    const hierarchicalGrouped: Record<string, Account[]> = {};
    Object.keys(groupedAccounts).forEach(type => {
        hierarchicalGrouped[type] = buildHierarchy(groupedAccounts[type]);
    });

    const toggleType = (type: string) => {
        setExpandedTypes((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
    };

    const toggleAccount = (id: string) => {
        setExpandedAccounts((prev) =>
            prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
        );
    };

    const getAccountName = (account: Account) => {
        if (locale === "ar" && account.accountNameAr) return account.accountNameAr;
        if (locale === "fr" && account.accountNameFr) return account.accountNameFr;
        return account.accountName;
    };

    const accountTypes = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];

    const renderAccountRow = (account: Account, level: number = 0): React.ReactNode => {
        const hasChildren = account.children && account.children.length > 0;
        const isExpanded = expandedAccounts.includes(account.id);

        return (
            <>
                <tr key={account.id} className="hover:bg-muted/50">
                    <td className="px-6 py-3 font-mono text-sm" style={{ paddingLeft: `${24 + level * 24}px` }}>
                        <div className="flex items-center gap-2">
                            {hasChildren && (
                                <button onClick={() => toggleAccount(account.id)} className="p-0.5 hover:bg-muted rounded">
                                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>
                            )}
                            {!hasChildren && <span className="w-5" />}
                            {account.accountCode}
                        </div>
                    </td>
                    <td className="px-4 py-3">
                        <span className={hasChildren ? "font-medium" : ""}>{getAccountName(account)}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                        {account.accountCategory.replace(/_/g, " ")}
                    </td>
                    <td className={`px-4 py-3 text-end font-medium ${account.currentBalance < 0 ? "text-red-600" : ""}`}>
                        {formatCurrency(account.currentBalance, locale, "EGP")}
                    </td>
                    <td className="px-4 py-3 text-end">
                        <button className="p-1 hover:bg-muted rounded">
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </td>
                </tr>
                {hasChildren && isExpanded && account.children?.map(child => renderAccountRow(child, level + 1))}
            </>
        );
    };

    const handleExport = () => {
        const csv = accounts?.map(acc =>
            `${acc.accountCode},${acc.accountName},${acc.accountType},${acc.accountCategory},${acc.normalBalance}`
        ).join("\n");
        const blob = new Blob([`Code,Name,Type,Category,Normal Balance\n${csv}`], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "chart-of-accounts.csv";
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t("chartOfAccounts")}</h1>
                    <p className="text-sm text-muted-foreground">{t("coaSubtitle")}</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex border border-border rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode("flat")}
                            className={`px-3 py-2 text-sm ${viewMode === "flat" ? "bg-muted font-medium" : ""}`}
                        >
                            Flat
                        </button>
                        <button
                            onClick={() => setViewMode("hierarchy")}
                            className={`px-3 py-2 text-sm ${viewMode === "hierarchy" ? "bg-muted font-medium" : ""}`}
                        >
                            Hierarchy
                        </button>
                    </div>
                    <button
                        onClick={() => setShowTemplatesModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
                    >
                        <FileText className="w-4 h-4" />
                        Templates
                    </button>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
                    >
                        <Upload className="w-4 h-4" />
                        Import
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
                    >
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    {(!accounts || accounts.length === 0) && (
                        <button
                            onClick={() => seedMutation.mutate()}
                            disabled={seedMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {seedMutation.isPending ? "Seeding..." : t("seedDefaults")}
                        </button>
                    )}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                        <Plus className="w-4 h-4" />
                        {t("addAccount")}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-5 gap-4">
                {accountTypes.map((type) => {
                    const total = (groupedAccounts[type] || []).reduce((sum, a) => sum + a.currentBalance, 0);
                    const Icon = TYPE_ICONS[type];
                    return (
                        <div key={type} className="p-4 bg-card rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`p-2 rounded-lg ${TYPE_COLORS[type]}`}>
                                    <Icon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">{t(type.toLowerCase())}</span>
                            </div>
                            <p className="text-xl font-bold">{formatCurrency(total, locale, "EGP")}</p>
                            <p className="text-xs text-muted-foreground">{(groupedAccounts[type] || []).length} {t("accounts")}</p>
                        </div>
                    );
                })}
            </div>

            {/* Accounts Tree */}
            <div className="bg-card rounded-lg border border-border">
                {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">{tCommon("loading")}</div>
                ) : (
                    <div className="divide-y divide-border">
                        {accountTypes.map((type) => {
                            const typeAccounts = viewMode === "hierarchy"
                                ? hierarchicalGrouped[type] || []
                                : groupedAccounts[type] || [];
                            const isExpanded = expandedTypes.includes(type);
                            const Icon = TYPE_ICONS[type];

                            return (
                                <div key={type}>
                                    <button
                                        onClick={() => toggleType(type)}
                                        className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        {isExpanded ? (
                                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                        )}
                                        <div className={`p-2 rounded-lg ${TYPE_COLORS[type]}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className="font-semibold flex-1 text-start">{t(type.toLowerCase())}</span>
                                        <span className="text-sm text-muted-foreground">{(groupedAccounts[type] || []).length} {t("accounts")}</span>
                                    </button>

                                    {isExpanded && typeAccounts.length > 0 && (
                                        <div className="bg-muted/30">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="text-xs text-muted-foreground uppercase">
                                                        <th className="px-6 py-2 text-start">{t("code")}</th>
                                                        <th className="px-4 py-2 text-start">{t("accountName")}</th>
                                                        <th className="px-4 py-2 text-start">{t("category")}</th>
                                                        <th className="px-4 py-2 text-end">{t("balance")}</th>
                                                        <th className="px-4 py-2 text-end">{tCommon("actions")}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {viewMode === "hierarchy"
                                                        ? typeAccounts.map((account) => renderAccountRow(account, 0))
                                                        : typeAccounts.map((account) => (
                                                            <tr key={account.id} className="hover:bg-muted/50">
                                                                <td className="px-6 py-3 font-mono text-sm">{account.accountCode}</td>
                                                                <td className="px-4 py-3">{getAccountName(account)}</td>
                                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                                    {account.accountCategory.replace(/_/g, " ")}
                                                                </td>
                                                                <td className={`px-4 py-3 text-end font-medium ${account.currentBalance < 0 ? "text-red-600" : ""}`}>
                                                                    {formatCurrency(account.currentBalance, locale, "EGP")}
                                                                </td>
                                                                <td className="px-4 py-3 text-end">
                                                                    <button className="p-1 hover:bg-muted rounded">
                                                                        <Edit2 className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    }
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add Account Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl p-6 max-w-lg w-full mx-4 border border-border">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Add New Account</h2>
                            <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-muted rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Account Code</label>
                                    <input
                                        type="text"
                                        value={newAccountCode}
                                        onChange={(e) => setNewAccountCode(e.target.value)}
                                        placeholder="e.g., 1100"
                                        className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Account Type</label>
                                    <select
                                        value={newAccountType}
                                        onChange={(e) => {
                                            setNewAccountType(e.target.value);
                                            setNewAccountCategory("");
                                            setNewNormalBalance(["ASSET", "EXPENSE"].includes(e.target.value) ? "DEBIT" : "CREDIT");
                                        }}
                                        className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                                    >
                                        {accountTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Account Name</label>
                                <input
                                    type="text"
                                    value={newAccountName}
                                    onChange={(e) => setNewAccountName(e.target.value)}
                                    placeholder="e.g., Accounts Receivable"
                                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Category</label>
                                    <select
                                        value={newAccountCategory}
                                        onChange={(e) => setNewAccountCategory(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                                    >
                                        <option value="">Select category...</option>
                                        {(CATEGORY_OPTIONS[newAccountType] || []).map(cat => (
                                            <option key={cat} value={cat}>{cat.replace(/_/g, " ")}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5">Parent Account</label>
                                    <select
                                        value={newAccountParent}
                                        onChange={(e) => setNewAccountParent(e.target.value)}
                                        className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                                    >
                                        <option value="">None (Top Level)</option>
                                        {(groupedAccounts[newAccountType] || []).map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.accountCode} - {acc.accountName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Normal Balance</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            value="DEBIT"
                                            checked={newNormalBalance === "DEBIT"}
                                            onChange={(e) => setNewNormalBalance(e.target.value)}
                                        />
                                        <span className="text-sm">Debit</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            value="CREDIT"
                                            checked={newNormalBalance === "CREDIT"}
                                            onChange={(e) => setNewNormalBalance(e.target.value)}
                                        />
                                        <span className="text-sm">Credit</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => createAccountMutation.mutate({
                                    accountCode: newAccountCode,
                                    accountName: newAccountName,
                                    accountType: newAccountType,
                                    accountCategory: newAccountCategory,
                                    normalBalance: newNormalBalance,
                                    parentId: newAccountParent || undefined,
                                })}
                                disabled={createAccountMutation.isPending || !newAccountCode || !newAccountName}
                                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
                            >
                                {createAccountMutation.isPending ? "Creating..." : "Create Account"}
                            </button>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="h-10 px-4 rounded-lg border border-input font-medium hover:bg-muted"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Templates Modal */}
            {showTemplatesModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl p-6 max-w-lg w-full mx-4 border border-border">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Account Templates</h2>
                            <button onClick={() => setShowTemplatesModal(false)} className="p-1 hover:bg-muted rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            Choose a template to quickly set up your chart of accounts
                        </p>
                        <div className="space-y-3">
                            {ACCOUNT_TEMPLATES.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => applyTemplateMutation.mutate(template.id)}
                                    disabled={applyTemplateMutation.isPending}
                                    className="w-full p-4 text-left border border-border rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium">{template.name}</div>
                                            <div className="text-sm text-muted-foreground">{template.description}</div>
                                        </div>
                                        <span className="text-xs bg-muted px-2 py-1 rounded">{template.accountCount} accounts</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl p-6 max-w-md w-full mx-4 border border-border">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Import Accounts</h2>
                            <button onClick={() => setShowImportModal(false)} className="p-1 hover:bg-muted rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm font-medium">Drop CSV file here or click to upload</p>
                                <p className="text-xs text-muted-foreground mt-1">Supports CSV format</p>
                                <input type="file" accept=".csv" className="hidden" />
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <p className="text-xs text-blue-800">
                                    <strong>CSV Format:</strong> Code, Name, Type, Category, Normal Balance
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                disabled
                                className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
                            >
                                Import
                            </button>
                            <button
                                onClick={() => setShowImportModal(false)}
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
