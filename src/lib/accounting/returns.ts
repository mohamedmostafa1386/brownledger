/**
 * returns.ts - Sales & Purchase Returns (Credit/Debit Notes)
 * 
 * Handles business logic for:
 * - Sales Returns (Credit Notes) from customers
 * - Purchase Returns (Debit Notes) to suppliers
 * - Stock level adjustments
 * - General Ledger posting
 */

import { prisma } from "@/lib/prisma";

export interface ReturnItemInput {
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
}

export interface SalesReturnInput {
    companyId: string;
    clientId: string;
    invoiceId?: string;
    posSaleId?: string;
    returnDate: Date;
    reason?: string;
    items: ReturnItemInput[];
}

export interface PurchaseReturnInput {
    companyId: string;
    supplierId: string;
    billId?: string;
    returnDate: Date;
    reason?: string;
    items: ReturnItemInput[];
}

/**
 * Process a Sales Return (Credit Note)
 */
export async function createSalesReturn(input: SalesReturnInput) {
    const { companyId, clientId, invoiceId, posSaleId, returnDate, reason, items } = input;

    // 1. Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    for (const item of items) {
        const itemTotal = item.quantity * item.unitPrice;
        const itemTax = itemTotal * (item.taxRate / 100);
        subtotal += itemTotal;
        taxAmount += itemTax;
    }
    const totalAmount = subtotal + taxAmount;

    // 2. Start Transaction
    return await prisma.$transaction(async (tx) => {
        // Generate return number
        const count = await tx.salesReturn.count({ where: { companyId } });
        const returnNumber = `SR-${String(count + 1).padStart(6, "0")}`;

        // Create SalesReturn record
        const salesReturn = await tx.salesReturn.create({
            data: {
                companyId,
                clientId,
                invoiceId,
                posSaleId,
                returnNumber,
                returnDate,
                reason,
                subtotal,
                taxAmount,
                totalAmount,
                status: "COMPLETED",
                items: {
                    create: items.map(item => ({
                        productId: item.productId,
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        taxRate: item.taxRate,
                        total: (item.quantity * item.unitPrice) * (1 + item.taxRate / 100),
                    })),
                },
            },
            include: { items: true },
        });

        // 3. Update Stock and generate Stock Movements
        for (const item of items) {
            if (item.productId) {
                // Increase stock
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (product && product.trackInventory) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stockQuantity: { increment: item.quantity } },
                    });

                    // Record movement
                    await tx.stockMovement.create({
                        data: {
                            companyId,
                            productId: item.productId,
                            type: "RETURN",
                            quantity: item.quantity,
                            balanceBefore: product.stockQuantity,
                            balanceAfter: product.stockQuantity + item.quantity,
                            reference: returnNumber,
                            referenceType: "SALES_RETURN",
                            notes: `Return from customer. Reason: ${reason || "N/A"}`,
                            date: returnDate,
                        },
                    });
                }
            }
        }

        // 4. Accounting (General Ledger)
        // Get company settings for accounts
        const company = await tx.company.findUnique({
            where: { id: companyId },
            select: {
                salesAccountId: true,
                arAccountId: true,
                salesTaxAccountId: true,
                inventoryAccountId: true,
                cogsAccountId: true,
            }
        });

        if (company) {
            // Generate Journal Entry
            const jeCount = await tx.journalEntry.count({ where: { companyId } });
            const journalNumber = `JE-SR-${String(jeCount + 1).padStart(6, "0")}`;

            const journalEntry = await tx.journalEntry.create({
                data: {
                    companyId,
                    journalNumber,
                    entryDate: returnDate,
                    description: `Sales Return ${returnNumber} - Client ${clientId}`,
                    sourceType: "MANUAL", // Or add SALES_RETURN to SourceType enum if possible
                    status: "POSTED",
                    totalDebit: totalAmount,
                    totalCredit: totalAmount,
                    lines: {
                        create: [
                            // Dr Sales Returns (or Sales Revenue)
                            {
                                accountId: company.salesAccountId || "", // In practice, usually a separate Sales Returns account
                                description: `Return of items: ${returnNumber}`,
                                debit: subtotal,
                                credit: 0,
                            },
                            // Dr Sales Tax Payable (reverse tax)
                            ...(taxAmount > 0 ? [{
                                accountId: company.salesTaxAccountId || "",
                                description: `Tax reversal: ${returnNumber}`,
                                debit: taxAmount,
                                credit: 0,
                            }] : []),
                            // Cr Accounts Receivable (or Cash if refunded)
                            {
                                accountId: company.arAccountId || "",
                                description: `Adjustment for return: ${returnNumber}`,
                                debit: 0,
                                credit: totalAmount,
                            }
                        ],
                    },
                },
            });

            // Update SalesReturn with JE reference
            await tx.salesReturn.update({
                where: { id: salesReturn.id },
                data: {
                    journalEntryId: journalEntry.id,
                    isPostedToGL: true,
                },
            });

            // Update Account Balances
            const jeLines = [
                { accountId: company.salesAccountId, debit: subtotal, credit: 0 },
                ...(taxAmount > 0 ? [{ accountId: company.salesTaxAccountId, debit: taxAmount, credit: 0 }] : []),
                { accountId: company.arAccountId, debit: 0, credit: totalAmount },
            ];

            for (const line of jeLines) {
                if (line.accountId) {
                    const account = await tx.account.findUnique({ where: { id: line.accountId } });
                    if (account) {
                        const change = line.debit - line.credit;
                        const balanceChange = account.normalBalance === "DEBIT" ? change : -change;
                        await tx.account.update({
                            where: { id: account.id },
                            data: { currentBalance: { increment: balanceChange } },
                        });
                    }
                }
            }
        }

        return salesReturn;
    });
}

/**
 * Process a Purchase Return (Debit Note)
 */
export async function createPurchaseReturn(input: PurchaseReturnInput) {
    const { companyId, supplierId, billId, returnDate, reason, items } = input;

    // 1. Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    for (const item of items) {
        const itemTotal = item.quantity * item.unitPrice;
        const itemTax = itemTotal * (item.taxRate / 100);
        subtotal += itemTotal;
        taxAmount += itemTax;
    }
    const totalAmount = subtotal + taxAmount;

    // 2. Start Transaction
    return await prisma.$transaction(async (tx) => {
        // Generate return number
        const count = await tx.purchaseReturn.count({ where: { companyId } });
        const returnNumber = `PR-${String(count + 1).padStart(6, "0")}`;

        // Create PurchaseReturn record
        const purchaseReturn = await tx.purchaseReturn.create({
            data: {
                companyId,
                supplierId,
                billId,
                returnNumber,
                returnDate,
                reason,
                subtotal,
                taxAmount,
                totalAmount,
                status: "COMPLETED",
                items: {
                    create: items.map(item => ({
                        productId: item.productId,
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        taxRate: item.taxRate,
                        total: (item.quantity * item.unitPrice) * (1 + item.taxRate / 100),
                    })),
                },
            },
            include: { items: true },
        });

        // 3. Update Stock and generate Stock Movements
        for (const item of items) {
            if (item.productId) {
                // Decrease stock
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (product && product.trackInventory) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stockQuantity: { decrement: item.quantity } },
                    });

                    // Record movement
                    await tx.stockMovement.create({
                        data: {
                            companyId,
                            productId: item.productId,
                            type: "RETURN",
                            quantity: -item.quantity, // Outgoing
                            balanceBefore: product.stockQuantity,
                            balanceAfter: product.stockQuantity - item.quantity,
                            reference: returnNumber,
                            referenceType: "PURCHASE_RETURN",
                            notes: `Return to supplier. Reason: ${reason || "N/A"}`,
                            date: returnDate,
                        },
                    });
                }
            }
        }

        // 4. Accounting (General Ledger)
        const company = await tx.company.findUnique({
            where: { id: companyId },
            select: {
                apAccountId: true,
                inventoryAccountId: true,
                // Add purchase returns account if exists, or use inventory for perpetual inventory
            }
        });

        if (company) {
            const jeCount = await tx.journalEntry.count({ where: { companyId } });
            const journalNumber = `JE-PR-${String(jeCount + 1).padStart(6, "0")}`;

            const journalEntry = await tx.journalEntry.create({
                data: {
                    companyId,
                    journalNumber,
                    entryDate: returnDate,
                    description: `Purchase Return ${returnNumber} - Supplier ${supplierId}`,
                    sourceType: "MANUAL",
                    status: "POSTED",
                    totalDebit: totalAmount,
                    totalCredit: totalAmount,
                    lines: {
                        create: [
                            // Dr Accounts Payable
                            {
                                accountId: company.apAccountId || "",
                                description: `Return to supplier: ${returnNumber}`,
                                debit: totalAmount,
                                credit: 0,
                            },
                            // Cr Inventory (or Purchase Returns)
                            {
                                accountId: company.inventoryAccountId || "",
                                description: `Inventory reduction: ${returnNumber}`,
                                debit: 0,
                                credit: totalAmount, // Simplification: assuming no tax separation for simplicity here, or Cr Tax Paid
                            }
                        ],
                    },
                },
            });

            await tx.purchaseReturn.update({
                where: { id: purchaseReturn.id },
                data: {
                    journalEntryId: journalEntry.id,
                    isPostedToGL: true,
                },
            });

            // Update Account Balances
            const jeLines = [
                { accountId: company.apAccountId, debit: totalAmount, credit: 0 },
                { accountId: company.inventoryAccountId, debit: 0, credit: totalAmount },
            ];

            for (const line of jeLines) {
                if (line.accountId) {
                    const account = await tx.account.findUnique({ where: { id: line.accountId } });
                    if (account) {
                        const change = line.debit - line.credit;
                        const balanceChange = account.normalBalance === "DEBIT" ? change : -change;
                        await tx.account.update({
                            where: { id: account.id },
                            data: { currentBalance: { increment: balanceChange } },
                        });
                    }
                }
            }
        }

        return purchaseReturn;
    });
}
