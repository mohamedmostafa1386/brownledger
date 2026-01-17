"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Database,
    Users,
    Truck,
    Package,
    Upload,
    Download,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    FileSpreadsheet,
    Settings,
    ShieldCheck,
    Loader2
} from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import Link from "next/link";
import { ImportWizard } from "@/components/settings/ImportWizard";
import * as XLSX from "xlsx";

const IMPORT_TYPES = [
    {
        id: "accounts",
        title: "Chart of Accounts",
        description: "Import your general ledger structure and opening balances.",
        icon: Database,
        color: "blue",
    },
    {
        id: "clients",
        title: "Clients & Customers",
        description: "Bulk upload your customer database and contact info.",
        icon: Users,
        color: "green",
    },
    {
        id: "suppliers",
        title: "Suppliers & Vendors",
        description: "Import supplier lists for accounts payable tracking.",
        icon: Truck,
        color: "purple",
    },
    {
        id: "products",
        title: "Inventory & Products",
        description: "Import your product catalog, prices, and stock levels.",
        icon: Package,
        color: "orange",
    }
] as const;

export default function ImportPage() {
    const { t } = useI18n();
    const [activeImport, setActiveImport] = useState<typeof IMPORT_TYPES[number]["id"] | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState<string | null>(null);

    const handleImportSuccess = (count: number) => {
        setActiveImport(null);
        setSuccessMessage(`Successfully imported ${count} records!`);
        setTimeout(() => setSuccessMessage(null), 5000);
    };

    const handleExport = async (id: string, title: string) => {
        setIsExporting(id);
        try {
            const res = await fetch(`/api/import?action=${id}`);
            if (!res.ok) throw new Error("Export failed");
            const data = await res.json();

            // Convert JSON to Worksheet
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, title);

            // Download file
            XLSX.writeFile(wb, `${id}_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error(error);
            alert("Failed to export data");
        } finally {
            setIsExporting(null);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Link href="/settings" className="hover:text-primary flex items-center gap-1 transition-colors">
                            <Settings className="h-4 w-4" />
                            {t("common.settings")}
                        </Link>
                        <span>/</span>
                        <span className="text-foreground font-medium">Data Import & Export</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">System Migration Tools</h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Seamlessly migrate data from your previous accounting software using CSV or Excel files.
                        Follow our templates or export your existing data.
                    </p>
                </div>

                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-xl border border-primary/20">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <div className="text-sm">
                        <p className="font-semibold text-primary">Secure Channel</p>
                        <p className="text-xs text-primary/80 text-muted-foreground leading-none">All transfers are encrypted</p>
                    </div>
                </div>
            </div>

            {successMessage && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-600"
                >
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">{successMessage}</span>
                </motion.div>
            )}

            {/* Import Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {IMPORT_TYPES.map((item, idx) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group relative bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:border-primary/50 transition-all flex flex-col justify-between"
                    >
                        <div className="space-y-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${item.color}-500/10 text-${item.color}-500 transition-colors group-hover:bg-primary group-hover:text-primary-foreground`}>
                                <item.icon className="h-6 w-6" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-lg leading-none">{item.title}</h3>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-2">
                            <button
                                onClick={() => setActiveImport(item.id)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                                <Upload className="h-4 w-4" />
                                Import
                            </button>
                            <button
                                onClick={() => handleExport(item.id, item.title)}
                                disabled={isExporting === item.id}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium hover:text-foreground hover:bg-muted/80 transition-colors"
                            >
                                {isExporting === item.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                Export Existing
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Help Section */}
            <div className="bg-muted/30 rounded-2xl border border-border p-8">
                <div className="flex items-start gap-6">
                    <div className="p-4 bg-background rounded-xl border border-border shadow-sm">
                        <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-bold">Migration Guidelines</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Follow these rules to ensure your data is imported correctly and your ledger stays balanced.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex gap-3 text-sm">
                                <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-[10px]">1</div>
                                <p><span className="font-bold">Templates:</span> Always use our CSV templates to match the required headers.</p>
                            </div>
                            <div className="flex gap-3 text-sm">
                                <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-[10px]">2</div>
                                <p><span className="font-bold">Sequential:</span> Import your <span className="underline">Accounts</span> first, then Clients and Products.</p>
                            </div>
                            <div className="flex gap-3 text-sm">
                                <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-[10px]">3</div>
                                <p><span className="font-bold">Opening Balances:</span> Recorded during the final step of Account migration.</p>
                            </div>
                            <div className="flex gap-3 text-sm">
                                <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-[10px]">4</div>
                                <p><span className="font-bold">Validation:</span> Duplicates based on SKU or Account Code will be skipped.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {activeImport && (
                <ImportWizard
                    type={activeImport}
                    title={IMPORT_TYPES.find(i => i.id === activeImport)?.title || ""}
                    onClose={() => setActiveImport(null)}
                    onSuccess={handleImportSuccess}
                />
            )}
        </div>
    );
}
