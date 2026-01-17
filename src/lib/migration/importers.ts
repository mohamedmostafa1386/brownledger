// Entity-specific importers for migration

import { prisma } from "@/lib/prisma";
import { EntityType } from "./templates";
import { parseDate, parseCurrency } from "./validators";

export interface ImportResult {
    success: boolean;
    created: number;
    updated: number;
    skipped: number;
    errors: { row: number; message: string }[];
}

// Map account type from various formats to our enum
function mapAccountType(type: string): "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE" {
    const upperType = String(type || "").toUpperCase().trim();

    const typeMap: Record<string, "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"> = {
        "ASSET": "ASSET",
        "ASSETS": "ASSET",
        "CURRENT ASSET": "ASSET",
        "FIXED ASSET": "ASSET",
        "LIABILITY": "LIABILITY",
        "LIABILITIES": "LIABILITY",
        "CURRENT LIABILITY": "LIABILITY",
        "LONG-TERM LIABILITY": "LIABILITY",
        "EQUITY": "EQUITY",
        "CAPITAL": "EQUITY",
        "OWNER'S EQUITY": "EQUITY",
        "REVENUE": "REVENUE",
        "INCOME": "REVENUE",
        "SALES": "REVENUE",
        "EXPENSE": "EXPENSE",
        "EXPENSES": "EXPENSE",
        "COST": "EXPENSE",
    };

    return typeMap[upperType] || "ASSET";
}

// Map account category
function mapAccountCategory(type: string): string {
    const upperType = String(type || "").toUpperCase().trim();

    const catMap: Record<string, string> = {
        "ASSET": "CURRENT_ASSET",
        "ASSETS": "CURRENT_ASSET",
        "CURRENT ASSET": "CURRENT_ASSET",
        "FIXED ASSET": "FIXED_ASSET",
        "LIABILITY": "CURRENT_LIABILITY",
        "LIABILITIES": "CURRENT_LIABILITY",
        "CURRENT LIABILITY": "CURRENT_LIABILITY",
        "LONG-TERM LIABILITY": "LONG_TERM_LIABILITY",
        "EQUITY": "CAPITAL",
        "CAPITAL": "CAPITAL",
        "REVENUE": "OPERATING_REVENUE",
        "INCOME": "OPERATING_REVENUE",
        "EXPENSE": "OPERATING_EXPENSE",
        "EXPENSES": "OPERATING_EXPENSE",
    };

    return catMap[upperType] || "CURRENT_ASSET";
}

// Import clients
export async function importClients(
    data: Record<string, any>[],
    columnMapping: Record<string, string>,
    companyId: string
): Promise<ImportResult> {
    const result: ImportResult = {
        success: true,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
    };

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 2;

        try {
            // Extract mapped values
            const mapped: Record<string, any> = {};
            for (const [sourceCol, targetField] of Object.entries(columnMapping)) {
                mapped[targetField] = row[sourceCol];
            }

            // Skip empty rows
            if (!mapped.name || String(mapped.name).trim() === "") {
                result.skipped++;
                continue;
            }

            const name = String(mapped.name).trim();

            // Check if client exists
            const existing = await prisma.client.findFirst({
                where: { companyId, name },
            });

            const clientData = {
                name,
                email: mapped.email ? String(mapped.email).trim() : null,
                phone: mapped.phone ? String(mapped.phone).trim() : null,
                address: mapped.address ? String(mapped.address).trim() : null,
                taxId: mapped.taxId ? String(mapped.taxId).trim() : null,
                contactPerson: mapped.contactPerson ? String(mapped.contactPerson).trim() : null,
                notes: mapped.notes ? String(mapped.notes).trim() : null,
            };

            if (existing) {
                await prisma.client.update({
                    where: { id: existing.id },
                    data: clientData,
                });
                result.updated++;
            } else {
                await prisma.client.create({
                    data: {
                        companyId,
                        ...clientData,
                    },
                });
                result.created++;
            }
        } catch (error) {
            result.errors.push({
                row: rowNum,
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    result.success = result.errors.length === 0;
    return result;
}

// Import suppliers
export async function importSuppliers(
    data: Record<string, any>[],
    columnMapping: Record<string, string>,
    companyId: string
): Promise<ImportResult> {
    const result: ImportResult = {
        success: true,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
    };

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 2;

        try {
            const mapped: Record<string, any> = {};
            for (const [sourceCol, targetField] of Object.entries(columnMapping)) {
                mapped[targetField] = row[sourceCol];
            }

            if (!mapped.name || String(mapped.name).trim() === "") {
                result.skipped++;
                continue;
            }

            const name = String(mapped.name).trim();

            const existing = await prisma.supplier.findFirst({
                where: { companyId, name },
            });

            const supplierData = {
                name,
                email: mapped.email ? String(mapped.email).trim() : null,
                phone: mapped.phone ? String(mapped.phone).trim() : null,
                address: mapped.address ? String(mapped.address).trim() : null,
                taxId: mapped.taxId ? String(mapped.taxId).trim() : null,
                contactPerson: mapped.contactPerson ? String(mapped.contactPerson).trim() : null,
                paymentTerms: mapped.paymentTerms ? parseInt(mapped.paymentTerms) || 30 : 30,
            };

            if (existing) {
                await prisma.supplier.update({
                    where: { id: existing.id },
                    data: supplierData,
                });
                result.updated++;
            } else {
                await prisma.supplier.create({
                    data: {
                        companyId,
                        ...supplierData,
                    },
                });
                result.created++;
            }
        } catch (error) {
            result.errors.push({
                row: rowNum,
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    result.success = result.errors.length === 0;
    return result;
}

// Import chart of accounts
export async function importAccounts(
    data: Record<string, any>[],
    columnMapping: Record<string, string>,
    companyId: string
): Promise<ImportResult> {
    const result: ImportResult = {
        success: true,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
    };

    // First pass: create all accounts
    const codeToId = new Map<string, string>();

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 2;

        try {
            const mapped: Record<string, any> = {};
            for (const [sourceCol, targetField] of Object.entries(columnMapping)) {
                mapped[targetField] = row[sourceCol];
            }

            if (!mapped.accountCode || !mapped.accountName) {
                result.skipped++;
                continue;
            }

            const accountCode = String(mapped.accountCode).trim();
            const accountName = String(mapped.accountName).trim();
            const accountType = mapAccountType(mapped.accountType || "ASSET");
            const accountCategory = mapAccountCategory(mapped.accountType || "ASSET");

            const existing = await prisma.account.findFirst({
                where: { companyId, accountCode },
            });

            const accountData = {
                accountCode,
                accountName,
                accountType,
                accountCategory,
                normalBalance: ["ASSET", "EXPENSE"].includes(accountType) ? "DEBIT" as const : "CREDIT" as const,
                currentBalance: parseCurrency(mapped.openingBalance || mapped.debit || 0) - parseCurrency(mapped.credit || 0),
            };

            if (existing) {
                await prisma.account.update({
                    where: { id: existing.id },
                    data: accountData,
                });
                codeToId.set(accountCode, existing.id);
                result.updated++;
            } else {
                const created = await prisma.account.create({
                    data: {
                        companyId,
                        ...accountData,
                    },
                });
                codeToId.set(accountCode, created.id);
                result.created++;
            }
        } catch (error) {
            result.errors.push({
                row: rowNum,
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    // Second pass: set parent relationships if parentCode is mapped
    if (columnMapping["parentCode"]) {
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const mapped: Record<string, any> = {};
            for (const [sourceCol, targetField] of Object.entries(columnMapping)) {
                mapped[targetField] = row[sourceCol];
            }

            if (mapped.parentCode && mapped.accountCode) {
                const accountCode = String(mapped.accountCode).trim();
                const parentCode = String(mapped.parentCode).trim();

                const accountId = codeToId.get(accountCode);
                const parentId = codeToId.get(parentCode);

                if (accountId && parentId) {
                    await prisma.account.update({
                        where: { id: accountId },
                        data: { parentId },
                    });
                }
            }
        }
    }

    result.success = result.errors.length === 0;
    return result;
}

// Import opening balances
export async function importOpeningBalances(
    data: Record<string, any>[],
    columnMapping: Record<string, string>,
    companyId: string
): Promise<ImportResult> {
    const result: ImportResult = {
        success: true,
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
    };

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNum = i + 2;

        try {
            const mapped: Record<string, any> = {};
            for (const [sourceCol, targetField] of Object.entries(columnMapping)) {
                mapped[targetField] = row[sourceCol];
            }

            if (!mapped.accountCode) {
                result.skipped++;
                continue;
            }

            const accountCode = String(mapped.accountCode).trim();

            // Find the account
            const account = await prisma.account.findFirst({
                where: { companyId, accountCode },
            });

            if (!account) {
                result.errors.push({
                    row: rowNum,
                    message: `Account ${accountCode} not found`,
                });
                continue;
            }

            // Calculate balance from debit/credit or balance field
            let balance = 0;
            if (mapped.balance !== undefined) {
                balance = parseCurrency(mapped.balance);
            } else {
                const debit = parseCurrency(mapped.debit || 0);
                const credit = parseCurrency(mapped.credit || 0);
                balance = debit - credit;
            }

            await prisma.account.update({
                where: { id: account.id },
                data: { currentBalance: balance },
            });
            result.updated++;

        } catch (error) {
            result.errors.push({
                row: rowNum,
                message: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }

    result.success = result.errors.length === 0;
    return result;
}

// Main importer dispatcher
export async function importData(
    entityType: EntityType,
    data: Record<string, any>[],
    columnMapping: Record<string, string>,
    companyId: string
): Promise<ImportResult> {
    switch (entityType) {
        case "clients":
            return importClients(data, columnMapping, companyId);
        case "suppliers":
            return importSuppliers(data, columnMapping, companyId);
        case "accounts":
            return importAccounts(data, columnMapping, companyId);
        case "opening_balances":
            return importOpeningBalances(data, columnMapping, companyId);
        default:
            return {
                success: false,
                created: 0,
                updated: 0,
                skipped: 0,
                errors: [{ row: 0, message: `Import not implemented for ${entityType}` }],
            };
    }
}
