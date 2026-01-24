"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface Session {
    id: string;
    fileName: string;
    entityType: string | null;
    columns: string[];
    columnMapping: Record<string, string>;
    rowCount: number;
    preview: Record<string, any>[];
}

interface ValidationResult {
    isValid: boolean;
    errors: { row: number; column: string; message: string }[];
    warnings: { row: number; column: string; message: string }[];
    validRows: number;
    totalRows: number;
}

interface ImportResult {
    success: boolean;
    created: number;
    updated: number;
    skipped: number;
    errors: { row: number; message: string }[];
}

const ENTITY_TYPES = [
    { id: "clients", name: "Clients/Customers", nameAr: "العملاء", icon: "👥", description: "Import customer data with name, email, phone, address" },
    { id: "suppliers", name: "Suppliers/Vendors", nameAr: "الموردين", icon: "🏪", description: "Import vendor data with contact info and payment terms" },
    { id: "accounts", name: "Chart of Accounts", nameAr: "دليل الحسابات", icon: "📊", description: "Import account codes, names, types, and balances" },
    { id: "opening_balances", name: "Opening Balances", nameAr: "الأرصدة الافتتاحية", icon: "💰", description: "Set opening balances for existing accounts" },
];

const TARGET_FIELDS: Record<string, { field: string; label: string; required: boolean }[]> = {
    clients: [
        { field: "name", label: "Name", required: true },
        { field: "email", label: "Email", required: false },
        { field: "phone", label: "Phone", required: false },
        { field: "address", label: "Address", required: false },
        { field: "taxId", label: "Tax ID", required: false },
        { field: "contactPerson", label: "Contact Person", required: false },
        { field: "notes", label: "Notes", required: false },
    ],
    suppliers: [
        { field: "name", label: "Name", required: true },
        { field: "email", label: "Email", required: false },
        { field: "phone", label: "Phone", required: false },
        { field: "address", label: "Address", required: false },
        { field: "taxId", label: "Tax ID", required: false },
        { field: "contactPerson", label: "Contact Person", required: false },
        { field: "paymentTerms", label: "Payment Terms (days)", required: false },
    ],
    accounts: [
        { field: "accountCode", label: "Account Code", required: true },
        { field: "accountName", label: "Account Name", required: true },
        { field: "accountType", label: "Type (Asset/Liability/Equity/Revenue/Expense)", required: true },
        { field: "parentCode", label: "Parent Account Code", required: false },
        { field: "openingBalance", label: "Opening Balance", required: false },
    ],
    opening_balances: [
        { field: "accountCode", label: "Account Code", required: true },
        { field: "accountName", label: "Account Name", required: false },
        { field: "debit", label: "Debit", required: false },
        { field: "credit", label: "Credit", required: false },
        { field: "balance", label: "Balance", required: false },
    ],
};

export default function MigrationPage() {
    const [step, setStep] = useState<"upload" | "map" | "validate" | "import" | "complete">("upload");
    const [session, setSession] = useState<Session | null>(null);
    const [entityType, setEntityType] = useState<string | null>(null);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", acceptedFiles[0]);
            formData.append("action", "analyze");

            const response = await fetch("/api/migration", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to analyze file");
            }

            setSession(data.session);
            setEntityType(data.session.entityType);
            setColumnMapping(data.session.columnMapping);
            setStep("map");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to upload file");
        } finally {
            setLoading(false);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "application/vnd.ms-excel": [".xls"],
            "text/csv": [".csv"],
        },
        maxFiles: 1,
    });

    const handleValidate = async () => {
        if (!session || !entityType) return;

        setLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("action", "validate");
            formData.append("sessionId", session.id);
            formData.append("entityType", entityType);
            formData.append("mapping", JSON.stringify(columnMapping));

            const response = await fetch("/api/migration", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Validation failed");
            }

            setValidation(data.validation);
            setStep("validate");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Validation failed");
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!session) return;

        setLoading(true);
        setError(null);
        setStep("import");

        try {
            const formData = new FormData();
            formData.append("action", "import");
            formData.append("sessionId", session.id);

            const response = await fetch("/api/migration", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Import failed");
            }

            setImportResult(data.result);
            setStep("complete");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Import failed");
            setStep("validate");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setStep("upload");
        setSession(null);
        setEntityType(null);
        setColumnMapping({});
        setValidation(null);
        setImportResult(null);
        setError(null);
    };

    const updateMapping = (sourceColumn: string, targetField: string) => {
        setColumnMapping(prev => {
            const newMapping = { ...prev };
            if (targetField === "") {
                delete newMapping[sourceColumn];
            } else {
                newMapping[sourceColumn] = targetField;
            }
            return newMapping;
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <span className="text-4xl">📦</span>
                        Data Migration Tool
                    </h1>
                    <p className="text-slate-600 mt-2">
                        Import data from Excel or CSV files into BrownLedger
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-8 gap-2">
                    {["upload", "map", "validate", "import", "complete"].map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${step === s
                                    ? "bg-blue-600 text-white scale-110"
                                    : ["upload", "map", "validate", "import", "complete"].indexOf(step) > i
                                        ? "bg-green-500 text-white"
                                        : "bg-slate-200 text-slate-500"
                                }`}>
                                {["upload", "map", "validate", "import", "complete"].indexOf(step) > i ? "✓" : i + 1}
                            </div>
                            {i < 4 && (
                                <div className={`w-12 h-1 mx-1 ${["upload", "map", "validate", "import", "complete"].indexOf(step) > i
                                        ? "bg-green-500"
                                        : "bg-slate-200"
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                        <span>⚠️</span>
                        {error}
                        <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
                    </div>
                )}

                {/* Step 1: Upload */}
                {step === "upload" && (
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-xl font-semibold mb-6 text-slate-800">Step 1: Upload Your File</h2>

                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${isDragActive
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-slate-300 hover:border-blue-400 hover:bg-slate-50"
                                }`}
                        >
                            <input {...getInputProps()} />
                            <div className="text-5xl mb-4">📁</div>
                            {isDragActive ? (
                                <p className="text-lg text-blue-600">Drop the file here...</p>
                            ) : (
                                <>
                                    <p className="text-lg text-slate-700 mb-2">
                                        Drag & drop your Excel or CSV file here
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        or click to browse
                                    </p>
                                </>
                            )}
                            {loading && (
                                <div className="mt-4 flex items-center justify-center gap-2 text-blue-600">
                                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    Analyzing file...
                                </div>
                            )}
                        </div>

                        <div className="mt-8">
                            <h3 className="font-medium text-slate-700 mb-4">Supported Data Types:</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {ENTITY_TYPES.map(et => (
                                    <div key={et.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xl">{et.icon}</span>
                                            <span className="font-medium text-slate-700">{et.name}</span>
                                        </div>
                                        <p className="text-sm text-slate-500">{et.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Map Columns */}
                {step === "map" && session && (
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-xl font-semibold mb-2 text-slate-800">Step 2: Map Columns</h2>
                        <p className="text-slate-600 mb-6">
                            File: <span className="font-medium">{session.fileName}</span> •
                            {session.rowCount} rows detected
                        </p>

                        {/* Entity Type Selection */}
                        <div className="mb-6">
                            <label className="font-medium text-slate-700 block mb-2">Data Type:</label>
                            <div className="grid grid-cols-2 gap-3">
                                {ENTITY_TYPES.map(et => (
                                    <button
                                        key={et.id}
                                        onClick={() => {
                                            setEntityType(et.id);
                                            // Reset mapping when changing entity type
                                            if (session) {
                                                const newMapping: Record<string, string> = {};
                                                // Auto-map if switching to detected type
                                                setColumnMapping(newMapping);
                                            }
                                        }}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${entityType === et.id
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-slate-200 hover:border-blue-300"
                                            }`}
                                    >
                                        <span className="text-xl mr-2">{et.icon}</span>
                                        <span className="font-medium">{et.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Column Mapping */}
                        {entityType && TARGET_FIELDS[entityType] && (
                            <div className="mb-6">
                                <label className="font-medium text-slate-700 block mb-2">Column Mapping:</label>
                                <div className="space-y-3">
                                    {TARGET_FIELDS[entityType].map(field => (
                                        <div key={field.field} className="flex items-center gap-4">
                                            <div className="w-48 flex items-center">
                                                <span className="text-slate-700">{field.label}</span>
                                                {field.required && <span className="text-red-500 ml-1">*</span>}
                                            </div>
                                            <span className="text-slate-400">←</span>
                                            <select
                                                value={Object.entries(columnMapping).find(([, v]) => v === field.field)?.[0] || ""}
                                                onChange={(e) => {
                                                    // Remove old mapping for this field
                                                    const oldSource = Object.entries(columnMapping).find(([, v]) => v === field.field)?.[0];
                                                    if (oldSource) {
                                                        updateMapping(oldSource, "");
                                                    }
                                                    // Add new mapping
                                                    if (e.target.value) {
                                                        updateMapping(e.target.value, field.field);
                                                    }
                                                }}
                                                className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="">(Not mapped)</option>
                                                {session.columns.map(col => (
                                                    <option key={col} value={col}>{col}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Preview */}
                        {session.preview.length > 0 && (
                            <div className="mb-6">
                                <label className="font-medium text-slate-700 block mb-2">Data Preview (first 5 rows):</label>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-100">
                                                {session.columns.map(col => (
                                                    <th key={col} className="p-2 text-left font-medium text-slate-700 border-b">
                                                        {col}
                                                        {columnMapping[col] && (
                                                            <span className="ml-1 text-xs text-blue-600">
                                                                → {columnMapping[col]}
                                                            </span>
                                                        )}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {session.preview.map((row, i) => (
                                                <tr key={i} className="border-b border-slate-100">
                                                    {session.columns.map(col => (
                                                        <td key={col} className="p-2 text-slate-600">
                                                            {String(row[col] ?? "")}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-between">
                            <button
                                onClick={handleReset}
                                className="px-6 py-2 text-slate-600 hover:text-slate-800"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleValidate}
                                disabled={!entityType || loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Validating...
                                    </>
                                ) : (
                                    "Validate Data →"
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Validate */}
                {step === "validate" && validation && (
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-xl font-semibold mb-2 text-slate-800">Step 3: Review Validation</h2>

                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="text-2xl font-bold text-green-600">{validation.validRows}</div>
                                <div className="text-sm text-green-700">Valid Rows</div>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                <div className="text-2xl font-bold text-red-600">{validation.errors.length}</div>
                                <div className="text-sm text-red-700">Errors</div>
                            </div>
                            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="text-2xl font-bold text-yellow-600">{validation.warnings.length}</div>
                                <div className="text-sm text-yellow-700">Warnings</div>
                            </div>
                        </div>

                        {/* Errors */}
                        {validation.errors.length > 0 && (
                            <div className="mb-6">
                                <h3 className="font-medium text-red-700 mb-2">Errors (must fix):</h3>
                                <div className="max-h-48 overflow-y-auto space-y-2">
                                    {validation.errors.slice(0, 20).map((err, i) => (
                                        <div key={i} className="p-2 bg-red-50 rounded text-sm text-red-700 flex items-center gap-2">
                                            <span className="font-medium">Row {err.row}:</span>
                                            <span>{err.column}</span>
                                            <span>-</span>
                                            <span>{err.message}</span>
                                        </div>
                                    ))}
                                    {validation.errors.length > 20 && (
                                        <div className="text-sm text-red-500">
                                            ... and {validation.errors.length - 20} more errors
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Warnings */}
                        {validation.warnings.length > 0 && (
                            <div className="mb-6">
                                <h3 className="font-medium text-yellow-700 mb-2">Warnings (optional):</h3>
                                <div className="max-h-32 overflow-y-auto space-y-2">
                                    {validation.warnings.slice(0, 10).map((warn, i) => (
                                        <div key={i} className="p-2 bg-yellow-50 rounded text-sm text-yellow-700">
                                            Row {warn.row}: {warn.column} - {warn.message}
                                        </div>
                                    ))}
                                    {validation.warnings.length > 10 && (
                                        <div className="text-sm text-yellow-500">
                                            ... and {validation.warnings.length - 10} more warnings
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-between">
                            <button
                                onClick={() => setStep("map")}
                                className="px-6 py-2 text-slate-600 hover:text-slate-800"
                            >
                                ← Back to Mapping
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={validation.errors.length > 0 || loading}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        Import {validation.validRows} rows →
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Importing */}
                {step === "import" && (
                    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                        <h2 className="text-xl font-semibold text-slate-800 mb-2">Importing Data...</h2>
                        <p className="text-slate-600">Please wait while your data is being imported.</p>
                    </div>
                )}

                {/* Step 5: Complete */}
                {step === "complete" && importResult && (
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <div className="text-center mb-6">
                            <div className="text-6xl mb-4">{importResult.success ? "✅" : "⚠️"}</div>
                            <h2 className="text-2xl font-bold text-slate-800">
                                {importResult.success ? "Import Complete!" : "Import Completed with Errors"}
                            </h2>
                        </div>

                        {/* Results */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                                <div className="text-3xl font-bold text-green-600">{importResult.created}</div>
                                <div className="text-sm text-green-700">Created</div>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
                                <div className="text-3xl font-bold text-blue-600">{importResult.updated}</div>
                                <div className="text-sm text-blue-700">Updated</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
                                <div className="text-3xl font-bold text-slate-600">{importResult.skipped}</div>
                                <div className="text-sm text-slate-700">Skipped</div>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-center">
                                <div className="text-3xl font-bold text-red-600">{importResult.errors.length}</div>
                                <div className="text-sm text-red-700">Errors</div>
                            </div>
                        </div>

                        {/* Import Errors */}
                        {importResult.errors.length > 0 && (
                            <div className="mb-6">
                                <h3 className="font-medium text-red-700 mb-2">Import Errors:</h3>
                                <div className="max-h-32 overflow-y-auto space-y-2">
                                    {importResult.errors.map((err, i) => (
                                        <div key={i} className="p-2 bg-red-50 rounded text-sm text-red-700">
                                            Row {err.row}: {err.message}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={handleReset}
                                className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                            >
                                Import Another File
                            </button>
                            <a
                                href={entityType === "clients" ? "/clients" : entityType === "suppliers" ? "/suppliers" : "/chart-of-accounts"}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                View Imported Data →
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
