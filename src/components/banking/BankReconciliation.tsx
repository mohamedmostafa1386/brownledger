"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n-context";
import {
    Building2,
    CheckCircle2,
    XCircle,
    ArrowRightLeft,
    Link2,
    Unlink,
    RefreshCcw,
    AlertTriangle,
    FileText,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface SystemTransaction {
    id: string;
    type: string;
    date: string;
    description: string;
    reference: string;
    amount: number;
    isCredit: boolean;
    isReconciled: boolean;
    matchedBankEntryId: string | null;
}

interface BankEntry {
    id: string;
    date: string;
    description: string;
    reference: string;
    amount: number;
    isCredit: boolean;
    balance: number;
    isMatched: boolean;
    matchedSystemId: string | null;
}

export function BankReconciliation() {
    const { t, locale } = useI18n();
    const queryClient = useQueryClient();
    const [selectedBankAccount, setSelectedBankAccount] = useState<string>("");
    const [selectedSystemTx, setSelectedSystemTx] = useState<string | null>(null);
    const [selectedBankEntry, setSelectedBankEntry] = useState<string | null>(null);
    const [matches, setMatches] = useState<{ systemId: string; bankId: string }[]>([]);

    // Fetch bank accounts
    const { data: accountsData } = useQuery({
        queryKey: ["bank-accounts-recon"],
        queryFn: () => fetch("/api/banking/reconciliation").then(r => r.json()),
    });

    // Fetch reconciliation data for selected account
    const { data: reconData, isLoading, refetch } = useQuery({
        queryKey: ["reconciliation", selectedBankAccount],
        queryFn: () => fetch(`/api/banking/reconciliation?bankAccountId=${selectedBankAccount}`).then(r => r.json()),
        enabled: !!selectedBankAccount,
    });

    // Submit reconciliation
    const submitReconciliation = useMutation({
        mutationFn: (data: any) => fetch("/api/banking/reconciliation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        }).then(r => r.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reconciliation"] });
            setMatches([]);
        },
    });

    // Handle matching
    const handleMatch = () => {
        if (selectedSystemTx && selectedBankEntry) {
            setMatches([...matches, { systemId: selectedSystemTx, bankId: selectedBankEntry }]);
            setSelectedSystemTx(null);
            setSelectedBankEntry(null);
        }
    };

    const handleUnmatch = (systemId: string) => {
        setMatches(matches.filter(m => m.systemId !== systemId));
    };

    const isSystemTxMatched = (id: string) => matches.some(m => m.systemId === id);
    const isBankEntryMatched = (id: string) => matches.some(m => m.bankId === id);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Reconciliation Tool</h2>
                    <p className="text-muted-foreground text-sm">Match bank statements with system transactions</p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={selectedBankAccount}
                        onChange={(e) => setSelectedBankAccount(e.target.value)}
                        className="px-4 py-2 border border-border rounded-lg bg-background min-w-[200px]"
                    >
                        <option value="">Select Bank Account</option>
                        {(accountsData?.bankAccounts || []).map((acc: any) => (
                            <option key={acc.id} value={acc.id}>{acc.accountName}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => refetch()}
                        className="p-2 border border-border rounded-lg hover:bg-muted"
                    >
                        <RefreshCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Reconciliation Summary */}
            {reconData?.reconciliation && (
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-card rounded-lg border border-border p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Building2 className="w-4 h-4" />
                            <span className="text-sm">Bank Statement</span>
                        </div>
                        <p className="text-xl font-bold">{formatCurrency(reconData.reconciliation.statementBalance, locale, "EGP")}</p>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">System Balance</span>
                        </div>
                        <p className="text-xl font-bold">{formatCurrency(reconData.reconciliation.systemBalance, locale, "EGP")}</p>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm">Difference</span>
                        </div>
                        <p className={`text-xl font-bold ${reconData.reconciliation.difference === 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(reconData.reconciliation.difference, locale, "EGP")}
                        </p>
                    </div>
                    <div className="bg-card rounded-lg border border-border p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            {reconData.reconciliation.isReconciled ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm">Status</span>
                        </div>
                        <p className={`text-xl font-bold ${reconData.reconciliation.isReconciled ? "text-green-600" : "text-orange-600"}`}>
                            {reconData.reconciliation.isReconciled ? "Reconciled" : `${reconData.reconciliation.unreconciledCount} Pending`}
                        </p>
                    </div>
                </div>
            )}

            {/* Match Button */}
            {selectedSystemTx && selectedBankEntry && (
                <div className="flex justify-center">
                    <button
                        onClick={handleMatch}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 animate-pulse"
                    >
                        <Link2 className="w-5 h-5" />
                        Match Selected Transactions
                    </button>
                </div>
            )}

            {/* Two-Panel Layout */}
            {selectedBankAccount && (
                <div className="grid grid-cols-2 gap-6">
                    {/* System Transactions */}
                    <div className="bg-card rounded-lg border border-border">
                        <div className="p-4 border-b border-border">
                            <h2 className="font-semibold flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                System Transactions
                            </h2>
                            <p className="text-sm text-muted-foreground">Payments and expenses from your books</p>
                        </div>
                        <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                            {isLoading ? (
                                <div className="p-8 text-center text-muted-foreground">Loading...</div>
                            ) : (
                                (reconData?.systemTransactions || []).map((tx: SystemTransaction) => {
                                    const isMatched = isSystemTxMatched(tx.id);
                                    const isSelected = selectedSystemTx === tx.id;

                                    return (
                                        <div
                                            key={tx.id}
                                            onClick={() => !isMatched && setSelectedSystemTx(isSelected ? null : tx.id)}
                                            className={`p-3 cursor-pointer transition-all ${isMatched
                                                ? "bg-green-50 dark:bg-green-950/20 opacity-60"
                                                : isSelected
                                                    ? "bg-primary/10 border-s-4 border-s-primary"
                                                    : "hover:bg-muted"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {isMatched ? (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleUnmatch(tx.id); }}
                                                            className="text-green-600"
                                                        >
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </button>
                                                    ) : (
                                                        <div className={`w-5 h-5 rounded-full border-2 ${isSelected ? "border-primary bg-primary" : "border-border"}`} />
                                                    )}
                                                    <div>
                                                        <p className="font-medium text-sm">{tx.description}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatDate(tx.date)} • {tx.reference || "No ref"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`font-semibold ${tx.isCredit ? "text-green-600" : "text-red-600"}`}>
                                                    {tx.isCredit ? "+" : "-"}{formatCurrency(tx.amount, locale, "EGP")}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Bank Statement Entries */}
                    <div className="bg-card rounded-lg border border-border">
                        <div className="p-4 border-b border-border">
                            <h2 className="font-semibold flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-purple-600" />
                                Bank Statement
                            </h2>
                            <p className="text-sm text-muted-foreground">Entries from your bank statement</p>
                        </div>
                        <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                            {isLoading ? (
                                <div className="p-8 text-center text-muted-foreground">Loading...</div>
                            ) : (
                                (reconData?.bankStatementEntries || []).map((entry: BankEntry) => {
                                    const isMatched = isBankEntryMatched(entry.id);
                                    const isSelected = selectedBankEntry === entry.id;

                                    return (
                                        <div
                                            key={entry.id}
                                            onClick={() => !isMatched && setSelectedBankEntry(isSelected ? null : entry.id)}
                                            className={`p-3 cursor-pointer transition-all ${isMatched
                                                ? "bg-green-50 dark:bg-green-950/20 opacity-60"
                                                : isSelected
                                                    ? "bg-primary/10 border-e-4 border-e-primary"
                                                    : "hover:bg-muted"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-sm">{entry.description}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(entry.date)} • {entry.reference}
                                                    </p>
                                                </div>
                                                <div className="text-end">
                                                    <span className={`font-semibold ${entry.isCredit ? "text-green-600" : "text-red-600"}`}>
                                                        {entry.isCredit ? "+" : "-"}{formatCurrency(entry.amount, locale, "EGP")}
                                                    </span>
                                                    <p className="text-xs text-muted-foreground">
                                                        Bal: {formatCurrency(entry.balance, locale, "EGP")}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Matched Transactions */}
            {matches.length > 0 && (
                <div className="bg-card rounded-lg border border-border p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-green-600" />
                        Matched Transactions ({matches.length})
                    </h3>
                    <div className="space-y-2">
                        {matches.map((match, i) => {
                            const sysTx = reconData?.systemTransactions?.find((t: any) => t.id === match.systemId);
                            const bankEntry = reconData?.bankStatementEntries?.find((e: any) => e.id === match.bankId);
                            return (
                                <div key={i} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm">{sysTx?.description}</span>
                                        <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm">{bankEntry?.description}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-medium text-green-600">{formatCurrency(sysTx?.amount || 0, locale, "EGP")}</span>
                                        <button
                                            onClick={() => handleUnmatch(match.systemId)}
                                            className="p-1 hover:bg-red-100 rounded"
                                        >
                                            <Unlink className="w-4 h-4 text-red-600" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <button
                        onClick={() => submitReconciliation.mutate({ matches, bankAccountId: selectedBankAccount })}
                        className="mt-4 w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        Complete Reconciliation
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!selectedBankAccount && (
                <div className="bg-card rounded-lg border border-border p-12 text-center">
                    <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Select a Bank Account</h3>
                    <p className="text-muted-foreground">Choose a bank account from the dropdown above to start reconciling</p>
                </div>
            )}
        </div>
    );
}
