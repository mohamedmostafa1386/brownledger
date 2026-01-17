// Data validation for migration

import { EntityType } from "./templates";

export interface ValidationError {
    row: number;
    column: string;
    value: any;
    message: string;
    severity: "error" | "warning";
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
    validRows: number;
    totalRows: number;
}

// Validation rules for each entity type
const VALIDATION_RULES: Record<EntityType, Record<string, (value: any, row: any) => string | null>> = {
    clients: {
        name: (value) => {
            if (!value || String(value).trim() === "") {
                return "Client name is required";
            }
            if (String(value).length < 2) {
                return "Client name must be at least 2 characters";
            }
            return null;
        },
        email: (value) => {
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
                return "Invalid email format";
            }
            return null;
        },
        phone: (value) => {
            if (value && String(value).length < 6) {
                return "Phone number seems too short";
            }
            return null;
        },
    },
    suppliers: {
        name: (value) => {
            if (!value || String(value).trim() === "") {
                return "Supplier name is required";
            }
            return null;
        },
        email: (value) => {
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
                return "Invalid email format";
            }
            return null;
        },
    },
    accounts: {
        accountCode: (value) => {
            if (!value || String(value).trim() === "") {
                return "Account code is required";
            }
            return null;
        },
        accountName: (value) => {
            if (!value || String(value).trim() === "") {
                return "Account name is required";
            }
            return null;
        },
        accountType: (value) => {
            const validTypes = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];
            const upperValue = String(value || "").toUpperCase().trim();

            // Map common variations
            const typeMap: Record<string, string> = {
                "ASSETS": "ASSET",
                "LIABILITIES": "LIABILITY",
                "INCOME": "REVENUE",
                "EXPENSES": "EXPENSE",
                "CAPITAL": "EQUITY",
            };

            const mapped = typeMap[upperValue] || upperValue;
            if (!validTypes.includes(mapped)) {
                return `Invalid account type. Must be one of: ${validTypes.join(", ")}`;
            }
            return null;
        },
        openingBalance: (value) => {
            if (value !== undefined && value !== null && value !== "") {
                const num = parseFloat(String(value).replace(/[,]/g, ""));
                if (isNaN(num)) {
                    return "Opening balance must be a number";
                }
            }
            return null;
        },
    },
    invoices: {
        invoiceNumber: (value) => {
            if (!value || String(value).trim() === "") {
                return "Invoice number is required";
            }
            return null;
        },
        clientName: (value) => {
            if (!value || String(value).trim() === "") {
                return "Client name is required";
            }
            return null;
        },
        invoiceDate: (value) => {
            if (!value) {
                return "Invoice date is required";
            }
            const date = parseDate(value);
            if (!date) {
                return "Invalid date format";
            }
            return null;
        },
        amount: (value) => {
            if (value === undefined || value === null || value === "") {
                return "Amount is required";
            }
            const num = parseFloat(String(value).replace(/[,]/g, ""));
            if (isNaN(num) || num < 0) {
                return "Amount must be a positive number";
            }
            return null;
        },
    },
    expenses: {
        description: (value) => {
            if (!value || String(value).trim() === "") {
                return "Description is required";
            }
            return null;
        },
        amount: (value) => {
            if (value === undefined || value === null || value === "") {
                return "Amount is required";
            }
            const num = parseFloat(String(value).replace(/[,]/g, ""));
            if (isNaN(num) || num < 0) {
                return "Amount must be a positive number";
            }
            return null;
        },
        date: (value) => {
            if (!value) {
                return "Date is required";
            }
            const date = parseDate(value);
            if (!date) {
                return "Invalid date format";
            }
            return null;
        },
    },
    journal_entries: {
        date: (value) => {
            if (!value) return "Date is required";
            if (!parseDate(value)) return "Invalid date format";
            return null;
        },
        accountCode: (value) => {
            if (!value) return "Account code is required";
            return null;
        },
    },
    opening_balances: {
        accountCode: (value) => {
            if (!value || String(value).trim() === "") {
                return "Account code is required";
            }
            return null;
        },
        balance: (value, row) => {
            // Either balance, debit, or credit must be provided
            if (!value && !row.debit && !row.credit) {
                return "Balance (or debit/credit) is required";
            }
            return null;
        },
    },
};

// Parse various date formats
export function parseDate(value: any): Date | null {
    if (!value) return null;

    // If already a Date
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value;
    }

    const str = String(value).trim();

    // Try various formats
    const formats = [
        // ISO format
        /^(\d{4})-(\d{2})-(\d{2})$/,
        // US format MM/DD/YYYY
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        // European format DD/MM/YYYY
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        // DD-MM-YYYY
        /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    ];

    // Try direct parse first
    const directParse = new Date(str);
    if (!isNaN(directParse.getTime())) {
        return directParse;
    }

    // Try Excel serial date (number of days since 1900-01-01)
    const numValue = parseFloat(str);
    if (!isNaN(numValue) && numValue > 1 && numValue < 100000) {
        const excelEpoch = new Date(1899, 11, 30);
        return new Date(excelEpoch.getTime() + numValue * 86400000);
    }

    return null;
}

// Parse currency values
export function parseCurrency(value: any): number {
    if (value === null || value === undefined || value === "") return 0;

    // Remove currency symbols and commas
    const cleaned = String(value)
        .replace(/[€$£¥₹]/g, "")
        .replace(/,/g, "")
        .replace(/\s/g, "")
        .trim();

    // Handle parentheses for negative (accounting format)
    if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
        return -parseFloat(cleaned.slice(1, -1)) || 0;
    }

    return parseFloat(cleaned) || 0;
}

// Validate data rows
export function validateData(
    data: Record<string, any>[],
    entityType: EntityType,
    columnMapping: Record<string, string>
): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    let validRows = 0;

    const rules = VALIDATION_RULES[entityType];

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // +2 for 1-indexed and header row
        let rowValid = true;

        // Create mapped row for validation
        const mappedRow: Record<string, any> = {};
        for (const [sourceCol, targetField] of Object.entries(columnMapping)) {
            mappedRow[targetField] = row[sourceCol];
        }

        // Skip empty rows
        const hasData = Object.values(mappedRow).some(v => v !== undefined && v !== null && v !== "");
        if (!hasData) continue;

        // Validate each mapped field
        for (const [field, validate] of Object.entries(rules)) {
            const value = mappedRow[field];
            const error = validate(value, mappedRow);

            if (error) {
                // Find source column for this field
                const sourceColumn = Object.entries(columnMapping).find(([, f]) => f === field)?.[0] || field;

                // Required field errors are errors, optional field issues are warnings
                const isRequired = ["name", "accountCode", "accountName", "invoiceNumber", "description", "amount", "date"].includes(field);

                if (isRequired) {
                    errors.push({
                        row: rowNumber,
                        column: sourceColumn,
                        value,
                        message: error,
                        severity: "error",
                    });
                    rowValid = false;
                } else {
                    warnings.push({
                        row: rowNumber,
                        column: sourceColumn,
                        value,
                        message: error,
                        severity: "warning",
                    });
                }
            }
        }

        if (rowValid) validRows++;
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        validRows,
        totalRows: data.length,
    };
}

// Check for duplicates
export function findDuplicates(
    data: Record<string, any>[],
    keyField: string
): number[] {
    const seen = new Map<string, number>();
    const duplicates: number[] = [];

    for (let i = 0; i < data.length; i++) {
        const key = String(data[i][keyField] || "").toLowerCase().trim();
        if (key) {
            if (seen.has(key)) {
                duplicates.push(i + 2); // +2 for 1-indexed and header
            } else {
                seen.set(key, i);
            }
        }
    }

    return duplicates;
}
