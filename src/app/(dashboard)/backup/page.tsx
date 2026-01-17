"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n-context";
import {
    Download,
    Upload,
    Database,
    FileJson,
    FileSpreadsheet,
    Clock,
    CheckCircle,
    AlertTriangle,
    HardDrive,
    RefreshCcw,
} from "lucide-react";

export default function BackupPage() {
    const { t, locale } = useI18n();
    const [isExporting, setIsExporting] = useState(false);
    const [exportResult, setExportResult] = useState<any>(null);
    const [selectedData, setSelectedData] = useState<string[]>(["all"]);

    // Fetch export preview
    const { data: previewData, isLoading, refetch } = useQuery({
        queryKey: ["backup-preview"],
        queryFn: () => fetch("/api/data/export?type=all").then(r => r.json()),
    });

    const handleExport = async (format: "json" | "download") => {
        setIsExporting(true);
        try {
            if (format === "download") {
                // Direct download
                window.open("/api/data/export?format=download", "_blank");
                setExportResult({ success: true, message: "Download started" });
            } else {
                const response = await fetch("/api/data/export?type=all");
                const data = await response.json();
                setExportResult(data);
            }
        } catch (error) {
            setExportResult({ error: "Export failed" });
        } finally {
            setIsExporting(false);
        }
    };

    const dataTypes = [
        { id: "accounts", label: "Chart of Accounts", icon: Database },
        { id: "clients", label: "Clients", icon: Database },
        { id: "suppliers", label: "Suppliers", icon: Database },
        { id: "invoices", label: "Invoices", icon: Database },
        { id: "expenses", label: "Expenses", icon: Database },
        { id: "products", label: "Products", icon: Database },
        { id: "journalEntries", label: "Journal Entries", icon: Database },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Data Backup & Export</h1>
                    <p className="text-muted-foreground">Export your data for backup or migration</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted"
                >
                    <RefreshCcw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Data Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card rounded-lg border border-border p-4">
                    <HardDrive className="w-8 h-8 text-primary mb-2" />
                    <p className="text-2xl font-bold">{previewData?.summary?.totalAccounts || 0}</p>
                    <p className="text-sm text-muted-foreground">Accounts</p>
                </div>
                <div className="bg-card rounded-lg border border-border p-4">
                    <HardDrive className="w-8 h-8 text-blue-500 mb-2" />
                    <p className="text-2xl font-bold">{previewData?.summary?.totalClients || 0}</p>
                    <p className="text-sm text-muted-foreground">Clients</p>
                </div>
                <div className="bg-card rounded-lg border border-border p-4">
                    <HardDrive className="w-8 h-8 text-green-500 mb-2" />
                    <p className="text-2xl font-bold">{previewData?.summary?.totalInvoices || 0}</p>
                    <p className="text-sm text-muted-foreground">Invoices</p>
                </div>
                <div className="bg-card rounded-lg border border-border p-4">
                    <HardDrive className="w-8 h-8 text-orange-500 mb-2" />
                    <p className="text-2xl font-bold">{previewData?.summary?.totalJournalEntries || 0}</p>
                    <p className="text-sm text-muted-foreground">Journal Entries</p>
                </div>
            </div>

            {/* Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Backup */}
                <div className="bg-card rounded-lg border border-border p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <FileJson className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold">Full Backup (JSON)</h2>
                            <p className="text-sm text-muted-foreground">Export all data as JSON file</p>
                        </div>
                    </div>

                    <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Complete company data
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Can be restored later
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Machine-readable format
                        </li>
                    </ul>

                    <button
                        onClick={() => handleExport("download")}
                        disabled={isExporting}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                        <Download className="w-5 h-5" />
                        {isExporting ? "Exporting..." : "Download Full Backup"}
                    </button>
                </div>

                {/* Excel Export */}
                <div className="bg-card rounded-lg border border-border p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                            <FileSpreadsheet className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold">Excel Export</h2>
                            <p className="text-sm text-muted-foreground">Export to Excel spreadsheets</p>
                        </div>
                    </div>

                    <ul className="space-y-2 mb-6 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Easy to view and edit
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Share with accountants
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            Import into other systems
                        </li>
                    </ul>

                    <div className="grid grid-cols-2 gap-2">
                        <a
                            href="/api/accounts/export?format=excel"
                            className="flex items-center justify-center gap-2 py-2 border border-border rounded-lg hover:bg-muted text-sm"
                        >
                            Accounts
                        </a>
                        <a
                            href="/api/clients/export?format=excel"
                            className="flex items-center justify-center gap-2 py-2 border border-border rounded-lg hover:bg-muted text-sm"
                        >
                            Clients
                        </a>
                        <a
                            href="/api/invoices/export?format=excel"
                            className="flex items-center justify-center gap-2 py-2 border border-border rounded-lg hover:bg-muted text-sm"
                        >
                            Invoices
                        </a>
                        <a
                            href="/api/expenses/export?format=excel"
                            className="flex items-center justify-center gap-2 py-2 border border-border rounded-lg hover:bg-muted text-sm"
                        >
                            Expenses
                        </a>
                    </div>
                </div>
            </div>

            {/* Restore Section */}
            <div className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Upload className="w-6 h-6 text-blue-500" />
                    <h2 className="font-semibold">Restore from Backup</h2>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-yellow-800 dark:text-yellow-200">Warning</p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                Restoring from a backup will overwrite existing data. Make sure to create a backup of your current data before proceeding.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-2">Drag and drop your backup file here</p>
                    <p className="text-sm text-muted-foreground mb-4">or</p>
                    <label className="inline-block px-4 py-2 bg-muted rounded-lg cursor-pointer hover:bg-muted/80">
                        <input type="file" accept=".json" className="hidden" />
                        Browse Files
                    </label>
                </div>
            </div>

            {/* Last Backup Info */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <div>
                        <p className="font-medium">Automatic Backups</p>
                        <p className="text-sm text-muted-foreground">Daily backups are kept for 30 days</p>
                    </div>
                </div>
                <span className="text-sm text-muted-foreground">
                    Last backup: {new Date().toLocaleDateString()}
                </span>
            </div>
        </div>
    );
}
