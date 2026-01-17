"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight, Download } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useI18n } from "@/lib/i18n-context";

interface ImportWizardProps {
    type: "accounts" | "clients" | "suppliers" | "products";
    title: string;
    onClose: () => void;
    onSuccess: (count: number) => void;
}

const TEMPLATES: Record<string, string[]> = {
    accounts: ["accountCode", "accountName", "accountType", "accountCategory", "normalBalance"],
    clients: ["name", "email", "phone", "address", "taxId"],
    suppliers: ["name", "contactPerson", "email", "phone", "taxId"],
    products: ["sku", "name", "costPrice", "sellingPrice", "stockQuantity"],
};

export function ImportWizard({ type, title, onClose, onSuccess }: ImportWizardProps) {
    const { t } = useI18n();
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Preview/Map, 3: Processing
    const [file, setFile] = useState<File | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            parseFile(selectedFile);
        }
    };

    const parseFile = (file: File) => {
        setFile(file);
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith(".csv")) {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setData(results.data);
                    validateData(results.data);
                    setStep(2);
                },
                error: (err) => {
                    setErrors([err.message]);
                }
            });
        } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const bstr = e.target?.result;
                const wb = XLSX.read(bstr, { type: "binary" });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const parsedData = XLSX.utils.sheet_to_json(ws);
                setData(parsedData);
                validateData(parsedData);
                setStep(2);
            };
            reader.readAsBinaryString(file);
        } else {
            setErrors(["Unsupported file format. Please use CSV or Excel (.xlsx/.xls)"]);
        }
    };

    const validateData = (parsedData: any[]) => {
        const requiredFields = TEMPLATES[type];
        const newErrors: string[] = [];

        if (parsedData.length === 0) {
            newErrors.push("The file is empty.");
        } else {
            const headers = Object.keys(parsedData[0]);
            requiredFields.forEach(field => {
                if (!headers.includes(field)) {
                    newErrors.push(`Missing required column: ${field}`);
                }
            });
        }

        setErrors(newErrors);
    };

    const startImport = async () => {
        if (errors.length > 0) return;

        setIsImporting(true);
        setStep(3);

        try {
            const res = await fetch(`/api/import?action=${type}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Import failed");
            }

            const result = await res.json();
            onSuccess(result.count);
        } catch (err: any) {
            setErrors([err.message]);
            setStep(2);
        } finally {
            setIsImporting(false);
        }
    };

    const downloadTemplate = () => {
        const headers = TEMPLATES[type];
        const ws = XLSX.utils.json_to_sheet([
            headers.reduce((acc, curr) => ({ ...acc, [curr]: "" }), {})
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, `template_${type}.xlsx`);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-card w-full max-w-2xl rounded-xl shadow-2xl border border-border overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Upload className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-bold">{title}</h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-8">
                        {/* Steps UI */}
                        <div className="flex items-center justify-center mb-10">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                        }`}>
                                        {step > s ? <CheckCircle2 className="h-6 w-6" /> : s}
                                    </div>
                                    {s < 3 && (
                                        <div className={`w-20 h-1 transition-colors ${step > s ? "bg-primary" : "bg-muted"
                                            }`} />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Step 1: Upload */}
                        {step === 1 && (
                            <div className="space-y-6 text-center">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-border rounded-2xl p-12 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                                >
                                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">Click to upload CSV</h3>
                                    <p className="text-sm text-muted-foreground">or drag and drop your file here</p>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".csv"
                                        className="hidden"
                                    />
                                </div>
                                <button
                                    onClick={downloadTemplate}
                                    className="flex items-center gap-2 mx-auto text-sm text-primary hover:underline font-medium"
                                >
                                    <Download className="h-4 w-4" />
                                    Download CSV Template
                                </button>
                            </div>
                        )}

                        {/* Step 2: Preview & Map */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <FileText className="h-4 w-4 text-primary" />
                                        {file?.name} ({data.length} rows)
                                    </div>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-xs text-muted-foreground hover:text-primary underline"
                                    >
                                        Change file
                                    </button>
                                </div>

                                {errors.length > 0 ? (
                                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-2">
                                        <div className="flex items-center gap-2 text-destructive font-semibold">
                                            <AlertCircle className="h-4 w-4" />
                                            Required field issues:
                                        </div>
                                        {errors.map((err, i) => (
                                            <div key={i} className="text-sm text-destructive pl-6">• {err}</div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-muted/50 rounded-lg border border-border p-4">
                                        <h4 className="text-sm font-semibold mb-3">Data Preview (first 3 rows)</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs">
                                                <thead>
                                                    <tr className="border-b border-border">
                                                        {Object.keys(data[0]).map(h => (
                                                            <th key={h} className="text-left py-2 pr-4">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.slice(0, 3).map((row, i) => (
                                                        <tr key={i} className="border-b border-border/50">
                                                            {Object.values(row).map((v: any, j) => (
                                                                <td key={j} className="py-2 pr-4 truncate max-w-[150px]">{v}</td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 mt-8">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={startImport}
                                        disabled={errors.length > 0}
                                        className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                    >
                                        Import Now
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Processing */}
                        {step === 3 && (
                            <div className="py-12 text-center space-y-6">
                                <div className="relative mx-auto w-24 h-24">
                                    <Loader2 className="h-24 w-24 text-primary animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Upload className="h-8 w-8 text-primary" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Importing your data...</h3>
                                    <p className="text-muted-foreground">Please wait while we process {data.length} records.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
