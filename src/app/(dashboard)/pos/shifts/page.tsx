"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, DollarSign, Play, Square, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";

interface CashierShift {
    id: string;
    startTime: string;
    endTime: string | null;
    openingCash: number;
    closingCash: number | null;
    expectedCash: number | null;
    cashDifference: number | null;
    totalSales: number | null;
    cashier: { name: string };
}

const fetchCurrentShift = async (): Promise<CashierShift | null> => {
    const res = await fetch("/api/pos/shifts?current=true");
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
};

const fetchShifts = async (): Promise<CashierShift[]> => {
    const res = await fetch("/api/pos/shifts");
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
};

export default function ShiftsPage() {
    const queryClient = useQueryClient();
    const [openingCash, setOpeningCash] = useState("");
    const [closingCash, setClosingCash] = useState("");
    const [showEndModal, setShowEndModal] = useState(false);

    const { data: currentShift, isLoading: loadingCurrent } = useQuery({
        queryKey: ["current-shift"],
        queryFn: fetchCurrentShift,
    });

    const { data: shifts = [], isLoading: loadingShifts } = useQuery({
        queryKey: ["shifts"],
        queryFn: fetchShifts,
    });

    const startShift = useMutation({
        mutationFn: async (cash: number) => {
            const res = await fetch("/api/pos/shifts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ openingCash: cash }),
            });
            if (!res.ok) throw new Error("Failed to start shift");
            return res.json();
        },
        onSuccess: () => {
            setOpeningCash("");
            queryClient.invalidateQueries({ queryKey: ["current-shift"] });
            queryClient.invalidateQueries({ queryKey: ["shifts"] });
        },
    });

    const endShift = useMutation({
        mutationFn: async (cash: number) => {
            if (!currentShift) return;
            const res = await fetch(`/api/pos/shifts/${currentShift.id}/end`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ closingCash: cash }),
            });
            if (!res.ok) throw new Error("Failed to end shift");
            return res.json();
        },
        onSuccess: () => {
            setClosingCash("");
            setShowEndModal(false);
            queryClient.invalidateQueries({ queryKey: ["current-shift"] });
            queryClient.invalidateQueries({ queryKey: ["shifts"] });
        },
    });

    const handleStartShift = () => {
        const cash = parseFloat(openingCash) || 0;
        startShift.mutate(cash);
    };

    const handleEndShift = () => {
        const cash = parseFloat(closingCash) || 0;
        endShift.mutate(cash);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Cashier Shifts</h1>
                <p className="text-muted-foreground">Manage cash drawer and shift tracking.</p>
            </div>

            {/* Current Shift Card */}
            <div className="rounded-xl border border-border bg-card p-6">
                {loadingCurrent ? (
                    <div className="h-32 skeleton rounded" />
                ) : currentShift ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">Shift Active</h2>
                                    <p className="text-muted-foreground">
                                        Started {formatDate(currentShift.startTime)} at{" "}
                                        {new Date(currentShift.startTime).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowEndModal(true)}
                                className="flex items-center gap-2 h-10 px-4 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                            >
                                <Square className="h-4 w-4" />
                                End Shift
                            </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-lg bg-muted/50 p-4">
                                <p className="text-sm text-muted-foreground">Opening Cash</p>
                                <p className="text-2xl font-bold">{formatCurrency(currentShift.openingCash)}</p>
                            </div>
                            <div className="rounded-lg bg-green-50 p-4">
                                <p className="text-sm text-green-700">Cashier</p>
                                <p className="text-2xl font-bold text-green-700">{currentShift.cashier.name}</p>
                            </div>
                            <div className="rounded-lg bg-blue-50 p-4">
                                <p className="text-sm text-blue-700">Duration</p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {Math.floor((Date.now() - new Date(currentShift.startTime).getTime()) / 60000)} min
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                <Play className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">Start Your Shift</h2>
                                <p className="text-muted-foreground">Enter the opening cash amount to begin.</p>
                            </div>
                        </div>

                        <div className="flex gap-4 max-w-md">
                            <div className="flex-1">
                                <label className="block text-sm font-medium mb-1.5">Opening Cash</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={openingCash}
                                    onChange={(e) => setOpeningCash(e.target.value)}
                                    placeholder="0.00"
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-lg"
                                />
                            </div>
                            <button
                                onClick={handleStartShift}
                                disabled={startShift.isPending}
                                className="mt-6 h-10 px-6 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                            >
                                Start
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Shift History */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="font-semibold">Shift History</h3>
                </div>
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Cashier</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Start</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">End</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Opening</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Closing</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Difference</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Sales</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {loadingShifts ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    {Array.from({ length: 7 }).map((_, j) => (
                                        <td key={j} className="px-4 py-3">
                                            <div className="h-4 w-20 skeleton rounded" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : shifts.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                    No shift history
                                </td>
                            </tr>
                        ) : (
                            shifts.filter(s => s.endTime).map((shift, index) => (
                                <motion.tr
                                    key={shift.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="hover:bg-muted/50"
                                >
                                    <td className="px-4 py-3 font-medium">{shift.cashier.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground text-sm">
                                        {new Date(shift.startTime).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground text-sm">
                                        {shift.endTime ? new Date(shift.endTime).toLocaleString() : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-right">{formatCurrency(shift.openingCash)}</td>
                                    <td className="px-4 py-3 text-right">
                                        {shift.closingCash !== null ? formatCurrency(shift.closingCash) : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {shift.cashDifference !== null && (
                                            <span className={shift.cashDifference < 0 ? "text-red-600" : shift.cashDifference > 0 ? "text-green-600" : ""}>
                                                {shift.cashDifference >= 0 ? "+" : ""}{formatCurrency(shift.cashDifference)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium">
                                        {shift.totalSales !== null ? formatCurrency(shift.totalSales) : "-"}
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* End Shift Modal */}
            {showEndModal && currentShift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full mx-4"
                    >
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <h3 className="font-semibold">End Shift</h3>
                            <button onClick={() => setShowEndModal(false)} className="rounded-lg p-2 hover:bg-muted">✕</button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                                <div className="flex items-center gap-2 text-amber-800">
                                    <AlertCircle className="h-5 w-5" />
                                    <span className="font-medium">Count your cash drawer</span>
                                </div>
                                <p className="text-sm text-amber-700 mt-1">
                                    Enter the total cash amount in your drawer to close the shift.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Closing Cash Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={closingCash}
                                    onChange={(e) => setClosingCash(e.target.value)}
                                    placeholder="0.00"
                                    className="h-12 w-full rounded-lg border border-input bg-background px-4 text-xl"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowEndModal(false)}
                                    className="flex-1 h-10 rounded-lg border border-input font-medium hover:bg-muted"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEndShift}
                                    disabled={endShift.isPending}
                                    className="flex-1 h-10 rounded-lg bg-red-500 font-medium text-white hover:bg-red-600 disabled:opacity-50"
                                >
                                    End Shift
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
