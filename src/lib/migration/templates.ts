// Migration templates for different data types and source systems

export type EntityType =
    | "clients"
    | "suppliers"
    | "accounts"
    | "invoices"
    | "expenses"
    | "journal_entries"
    | "opening_balances";

export interface ColumnMapping {
    sourceColumn: string;
    targetField: string;
    transform?: (value: any) => any;
    required?: boolean;
}

export interface MigrationTemplate {
    entityType: EntityType;
    name: string;
    description: string;
    requiredColumns: string[];
    optionalColumns: string[];
    columnMappings: Record<string, string>;
}

// Keywords to detect entity type from column headers
export const ENTITY_DETECTION_KEYWORDS: Record<EntityType, string[]> = {
    clients: ["client", "customer", "buyer", "debtor", "receivable", "client name", "customer name"],
    suppliers: ["supplier", "vendor", "creditor", "payable", "supplier name", "vendor name"],
    accounts: ["account", "ledger", "chart", "account code", "account number", "gl code"],
    invoices: ["invoice", "bill to", "invoice number", "inv no", "sales", "order"],
    expenses: ["expense", "cost", "payment", "bill", "receipt"],
    journal_entries: ["journal", "debit", "credit", "entry", "voucher"],
    opening_balances: ["balance", "opening", "beginning", "initial"],
};

// Field detection keywords for each entity type
export const FIELD_DETECTION: Record<EntityType, Record<string, string[]>> = {
    clients: {
        name: ["name", "client name", "customer name", "company", "business name", "اسم", "الاسم", "العميل"],
        email: ["email", "e-mail", "mail", "البريد"],
        phone: ["phone", "mobile", "tel", "telephone", "contact", "هاتف", "موبايل"],
        address: ["address", "location", "street", "city", "العنوان"],
        taxId: ["tax id", "tax number", "vat", "tin", "رقم ضريبي"],
        contactPerson: ["contact person", "contact name", "representative", "مسؤول"],
        notes: ["notes", "remarks", "comments", "ملاحظات"],
    },
    suppliers: {
        name: ["name", "supplier name", "vendor name", "company", "business name", "اسم", "المورد"],
        email: ["email", "e-mail", "mail", "البريد"],
        phone: ["phone", "mobile", "tel", "telephone", "contact", "هاتف"],
        address: ["address", "location", "street", "city", "العنوان"],
        taxId: ["tax id", "tax number", "vat", "tin", "رقم ضريبي"],
        contactPerson: ["contact person", "contact name", "representative"],
        paymentTerms: ["payment terms", "terms", "credit days"],
    },
    accounts: {
        accountCode: ["code", "account code", "account number", "gl code", "number", "no", "رقم الحساب"],
        accountName: ["name", "account name", "description", "title", "اسم الحساب"],
        accountType: ["type", "account type", "category", "class", "نوع"],
        parentCode: ["parent", "parent code", "parent account", "group"],
        openingBalance: ["balance", "opening", "opening balance", "debit", "credit", "الرصيد"],
    },
    invoices: {
        invoiceNumber: ["invoice number", "inv no", "invoice #", "number", "رقم الفاتورة"],
        clientName: ["client", "customer", "bill to", "client name", "اسم العميل"],
        invoiceDate: ["date", "invoice date", "dated", "التاريخ"],
        dueDate: ["due date", "due", "payment date", "تاريخ الاستحقاق"],
        amount: ["amount", "total", "value", "المبلغ"],
        description: ["description", "item", "details", "الوصف"],
        status: ["status", "paid", "الحالة"],
    },
    expenses: {
        description: ["description", "expense", "details", "item", "الوصف"],
        amount: ["amount", "value", "total", "المبلغ"],
        date: ["date", "expense date", "التاريخ"],
        category: ["category", "type", "الفئة"],
        vendor: ["vendor", "supplier", "paid to", "المورد"],
        paymentMethod: ["payment method", "method", "paid by", "طريقة الدفع"],
        reference: ["reference", "ref", "receipt", "المرجع"],
    },
    journal_entries: {
        date: ["date", "entry date", "journal date", "التاريخ"],
        description: ["description", "narration", "memo", "الوصف"],
        accountCode: ["account", "account code", "gl code", "حساب"],
        debit: ["debit", "dr", "مدين"],
        credit: ["credit", "cr", "دائن"],
        reference: ["reference", "ref", "voucher", "المرجع"],
    },
    opening_balances: {
        accountCode: ["account", "account code", "code", "رقم الحساب"],
        accountName: ["account name", "name", "اسم الحساب"],
        debit: ["debit", "debit balance", "dr", "مدين"],
        credit: ["credit", "credit balance", "cr", "دائن"],
        balance: ["balance", "amount", "الرصيد"],
    },
};

// Detect entity type from column headers
export function detectEntityType(columns: string[]): EntityType | null {
    const columnLower = columns.map(c => c.toLowerCase().trim());

    let bestMatch: EntityType | null = null;
    let bestScore = 0;

    for (const [entityType, keywords] of Object.entries(ENTITY_DETECTION_KEYWORDS)) {
        let score = 0;
        for (const keyword of keywords) {
            for (const col of columnLower) {
                if (col.includes(keyword)) {
                    score++;
                }
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestMatch = entityType as EntityType;
        }
    }

    // If no direct match, try field detection
    if (bestScore === 0) {
        for (const [entityType, fields] of Object.entries(FIELD_DETECTION)) {
            let score = 0;
            for (const [, keywords] of Object.entries(fields)) {
                for (const keyword of keywords) {
                    for (const col of columnLower) {
                        if (col.includes(keyword) || keyword.includes(col)) {
                            score++;
                        }
                    }
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestMatch = entityType as EntityType;
            }
        }
    }

    return bestMatch;
}

// Map source columns to target fields
export function mapColumns(columns: string[], entityType: EntityType): Record<string, string> {
    const fieldKeywords = FIELD_DETECTION[entityType];
    const mapping: Record<string, string> = {};

    for (const [field, keywords] of Object.entries(fieldKeywords)) {
        for (const col of columns) {
            const colLower = col.toLowerCase().trim();
            for (const keyword of keywords) {
                if (colLower === keyword || colLower.includes(keyword) || keyword.includes(colLower)) {
                    if (!mapping[col]) {
                        mapping[col] = field;
                    }
                    break;
                }
            }
        }
    }

    return mapping;
}

// Template definitions for common systems
export const SYSTEM_TEMPLATES: Record<string, MigrationTemplate[]> = {
    quickbooks: [
        {
            entityType: "clients",
            name: "QuickBooks Customers",
            description: "Import customers from QuickBooks customer list export",
            requiredColumns: ["Customer"],
            optionalColumns: ["Email", "Phone", "Address", "Tax Reg"],
            columnMappings: {
                "Customer": "name",
                "Email": "email",
                "Phone": "phone",
                "Address": "address",
                "Tax Reg": "taxId",
            },
        },
        {
            entityType: "accounts",
            name: "QuickBooks Chart of Accounts",
            description: "Import chart of accounts from QuickBooks",
            requiredColumns: ["Account #", "Account Name", "Type"],
            optionalColumns: ["Balance"],
            columnMappings: {
                "Account #": "accountCode",
                "Account Name": "accountName",
                "Type": "accountType",
                "Balance": "openingBalance",
            },
        },
    ],
    generic: [
        {
            entityType: "clients",
            name: "Generic Client List",
            description: "Basic client/customer list with name, email, phone",
            requiredColumns: ["Name"],
            optionalColumns: ["Email", "Phone", "Address"],
            columnMappings: {
                "Name": "name",
                "Email": "email",
                "Phone": "phone",
                "Address": "address",
            },
        },
    ],
};
