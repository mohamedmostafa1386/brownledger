"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Building2, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

// Mock data
const fetchBankingData = async () => {
    return {
        accounts: [
            { id: "1", name: "Business Checking", balance: 45000, accountNumber: "****1234" },
            { id: "2", name: "Business Savings", balance: 125000, accountNumber: "****5678" },
        ],
        transactions: [
            { id: "1", date: new Date(), description: "Client Payment - Tech Solutions", amount: 5000, type: "CREDIT" },
            { id: "2", date: new Date(), description: "Office Rent", amount: -2500, type: "DEBIT" },
            { id: "3", date: new Date(), description: "Software Subscription", amount: -99, type: "DEBIT" },
            { id: "4", date: new Date(), description: "Client Payment - Global Enterprises", amount: 3200, type: "CREDIT" },
            { id: "5", date: new Date(), description: "Marketing Expenses", amount: -450, type: "DEBIT" },
        ],
    };
};

export default function BankingPage() {
    const { data, isLoading } = useQuery({
        queryKey: ["banking"],
        queryFn: fetchBankingData,
    });

    const totalBalance = data?.accounts.reduce((sum, acc) => sum + acc.balance, 0) || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Banking</h1>
                    <p className="text-muted-foreground">Manage accounts and reconcile transactions.</p>
                </div>
                <button className="flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium hover:bg-muted">
                    <RefreshCw className="h-4 w-4" />
                    Sync Accounts
                </button>
            </div>

            {/* Total Balance */}
            <div className="rounded-xl border border-border bg-card p-6">
                <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
                <p className="text-4xl font-semibold">{formatCurrency(totalBalance)}</p>
            </div>

            {/* Accounts */}
            <div className="grid gap-4 md:grid-cols-2">
                {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-border bg-card p-6">
                            <div className="h-6 w-32 skeleton rounded mb-2" />
                            <div className="h-8 w-24 skeleton rounded" />
                        </div>
                    ))
                ) : (
                    data?.accounts.map((account, index) => (
                        <motion.div
                            key={account.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="rounded-xl border border-border bg-card p-6"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                    <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold">{account.name}</p>
                                    <p className="text-sm text-muted-foreground">{account.accountNumber}</p>
                                </div>
                            </div>
                            <p className="text-2xl font-semibold">{formatCurrency(account.balance)}</p>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Recent Transactions */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="p-4 border-b border-border">
                    <h3 className="font-semibold">Recent Transactions</h3>
                </div>
                <div className="divide-y divide-border">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4">
                                <div className="h-4 w-48 skeleton rounded" />
                                <div className="h-4 w-20 skeleton rounded" />
                            </div>
                        ))
                    ) : (
                        data?.transactions.map((tx, index) => (
                            <motion.div
                                key={tx.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center justify-between p-4 hover:bg-muted/50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${tx.type === "CREDIT" ? "bg-green-100" : "bg-red-100"
                                        }`}>
                                        {tx.type === "CREDIT" ? (
                                            <ArrowDownRight className="h-4 w-4 text-green-600" />
                                        ) : (
                                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium">{tx.description}</p>
                                        <p className="text-sm text-muted-foreground">{formatDate(tx.date)}</p>
                                    </div>
                                </div>
                                <p className={`font-semibold ${tx.type === "CREDIT" ? "text-green-600" : "text-red-600"}`}>
                                    {tx.type === "CREDIT" ? "+" : ""}{formatCurrency(tx.amount)}
                                </p>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
