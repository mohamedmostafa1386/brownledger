import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// IFRS Journal Entry Automation Service
// Automatically generates double-entry journal entries for transactions

interface JournalLine {
    accountCode: string;
    description: string;
    debit: number;
    credit: number;
}

interface JournalEntryData {
    companyId: string;
    description: string;
    reference: string;
    referenceType: string;
    lines: JournalLine[];
    userId?: string;
}

// Get account ID by code
async function getAccountId(companyId: string, accountCode: string): Promise<string | null> {
    const account = await prisma.account.findFirst({
        where: { companyId, accountCode },
    });
    return account?.id || null;
}

// Generate unique journal number
async function generateJournalNumber(companyId: string): Promise<string> {
    const count = await prisma.journalEntry.count({ where: { companyId } });
    return `JE-${String(count + 1).padStart(6, "0")}`;
}

// Create journal entry with validation
export async function createJournalEntry(data: JournalEntryData) {
    // IFRS Validation: Debits must equal Credits
    const totalDebits = data.lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredits = data.lines.reduce((sum, l) => sum + l.credit, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error(`IFRS Error: Journal entry must balance. Debits: ${totalDebits}, Credits: ${totalCredits}`);
    }

    const journalNumber = await generateJournalNumber(data.companyId);

    // Create journal entry with lines
    const entry = await prisma.journalEntry.create({
        data: {
            companyId: data.companyId,
            journalNumber,
            entryDate: new Date(),
            description: data.description,
            reference: data.reference,
            sourceType: data.referenceType as any,
            status: "POSTED",
            totalDebit: totalDebits,
            totalCredit: totalCredits,
            lines: {
                create: await Promise.all(data.lines.map(async (line) => {
                    const accountId = await getAccountId(data.companyId, line.accountCode);
                    if (!accountId) {
                        throw new Error(`Account not found: ${line.accountCode}`);
                    }
                    return {
                        accountId,
                        description: line.description,
                        debit: line.debit,
                        credit: line.credit,
                    };
                })),
            },
        },
    });

    // Update account balances
    for (const line of data.lines) {
        const account = await prisma.account.findFirst({
            where: { companyId: data.companyId, accountCode: line.accountCode },
        });
        if (account) {
            // IFRS: Debits increase ASSET/EXPENSE, Credits increase LIABILITY/EQUITY/REVENUE
            let balanceChange = 0;
            if (["ASSET", "EXPENSE"].includes(account.accountType)) {
                balanceChange = line.debit - line.credit;
            } else {
                balanceChange = line.credit - line.debit;
            }
            await prisma.account.update({
                where: { id: account.id },
                data: { currentBalance: account.currentBalance + balanceChange },
            });
        }
    }

    return entry;
}

// ============ IFRS TRANSACTION TEMPLATES ============

// IFRS 15: Revenue Recognition - Sale with invoice
export async function journalForSaleInvoice(
    companyId: string,
    invoiceId: string,
    revenue: number,
    tax: number,
    total: number
) {
    return createJournalEntry({
        companyId,
        description: `Sales Invoice ${invoiceId}`,
        reference: invoiceId,
        referenceType: "INVOICE",
        lines: [
            // Debit: Trade Receivables (Asset increases)
            { accountCode: "1100", description: "Trade Receivables", debit: total, credit: 0 },
            // Credit: Sales Revenue (Revenue increases)
            { accountCode: "4000", description: "Sales Revenue", debit: 0, credit: revenue },
            // Credit: VAT/Tax Payable (Liability increases)
            { accountCode: "2200", description: "Sales Tax Payable", debit: 0, credit: tax },
        ],
    });
}

// IFRS 15: Revenue Recognition - Payment received
export async function journalForPaymentReceived(
    companyId: string,
    paymentId: string,
    amount: number
) {
    return createJournalEntry({
        companyId,
        description: `Payment Received ${paymentId}`,
        reference: paymentId,
        referenceType: "PAYMENT_RECEIVED",
        lines: [
            // Debit: Cash (Asset increases)
            { accountCode: "1000", description: "Cash", debit: amount, credit: 0 },
            // Credit: Trade Receivables (Asset decreases)
            { accountCode: "1100", description: "Trade Receivables", debit: 0, credit: amount },
        ],
    });
}

// IAS 2: Inventory - Purchase of goods
export async function journalForPurchase(
    companyId: string,
    billId: string,
    inventoryCost: number,
    tax: number,
    total: number
) {
    return createJournalEntry({
        companyId,
        description: `Purchase Bill ${billId}`,
        reference: billId,
        referenceType: "BILL",
        lines: [
            // Debit: Inventory (Asset increases) - IAS 2
            { accountCode: "1200", description: "Inventory", debit: inventoryCost, credit: 0 },
            // Debit: Input VAT (if applicable)
            { accountCode: "1300", description: "Input VAT Recoverable", debit: tax, credit: 0 },
            // Credit: Trade Payables (Liability increases)
            { accountCode: "2000", description: "Trade Payables", debit: 0, credit: total },
        ],
    });
}

// IAS 2: COGS when sale is made
export async function journalForCOGS(
    companyId: string,
    saleId: string,
    costAmount: number
) {
    return createJournalEntry({
        companyId,
        description: `Cost of Sales - ${saleId}`,
        reference: saleId,
        referenceType: "POS_SALE",
        lines: [
            // Debit: Cost of Goods Sold (Expense increases)
            { accountCode: "5000", description: "Cost of Goods Sold", debit: costAmount, credit: 0 },
            // Credit: Inventory (Asset decreases)
            { accountCode: "1200", description: "Inventory", debit: 0, credit: costAmount },
        ],
    });
}

// Payment to supplier
export async function journalForPaymentMade(
    companyId: string,
    paymentId: string,
    amount: number
) {
    return createJournalEntry({
        companyId,
        description: `Payment Made ${paymentId}`,
        reference: paymentId,
        referenceType: "PAYMENT_MADE",
        lines: [
            // Debit: Trade Payables (Liability decreases)
            { accountCode: "2000", description: "Trade Payables", debit: amount, credit: 0 },
            // Credit: Cash (Asset decreases)
            { accountCode: "1000", description: "Cash", debit: 0, credit: amount },
        ],
    });
}

// Expense recognition
export async function journalForExpense(
    companyId: string,
    expenseId: string,
    expenseAccountCode: string,
    amount: number,
    description: string
) {
    return createJournalEntry({
        companyId,
        description: `Expense - ${description}`,
        reference: expenseId,
        referenceType: "EXPENSE",
        lines: [
            // Debit: Expense account (Expense increases)
            { accountCode: expenseAccountCode, description, debit: amount, credit: 0 },
            // Credit: Cash or Payables
            { accountCode: "1000", description: "Cash", debit: 0, credit: amount },
        ],
    });
}

// IAS 16: Depreciation
export async function journalForDepreciation(
    companyId: string,
    assetId: string,
    amount: number
) {
    return createJournalEntry({
        companyId,
        description: `Depreciation - ${assetId}`,
        reference: assetId,
        referenceType: "MANUAL",
        lines: [
            // Debit: Depreciation Expense
            { accountCode: "6500", description: "Depreciation Expense", debit: amount, credit: 0 },
            // Credit: Accumulated Depreciation (contra asset)
            { accountCode: "1550", description: "Accumulated Depreciation", debit: 0, credit: amount },
        ],
    });
}

// POS Cash Sale
export async function journalForPOSSale(
    companyId: string,
    saleId: string,
    revenue: number,
    tax: number,
    total: number,
    costOfGoods: number
) {
    // First entry: Record the sale
    await createJournalEntry({
        companyId,
        description: `POS Sale ${saleId}`,
        reference: saleId,
        referenceType: "POS_SALE",
        lines: [
            { accountCode: "1000", description: "Cash", debit: total, credit: 0 },
            { accountCode: "4000", description: "Sales Revenue", debit: 0, credit: revenue },
            { accountCode: "2200", description: "Sales Tax Payable", debit: 0, credit: tax },
        ],
    });

    // Second entry: Record COGS
    if (costOfGoods > 0) {
        await journalForCOGS(companyId, saleId, costOfGoods);
    }
}

export default {
    createJournalEntry,
    journalForSaleInvoice,
    journalForPaymentReceived,
    journalForPurchase,
    journalForCOGS,
    journalForPaymentMade,
    journalForExpense,
    journalForDepreciation,
    journalForPOSSale,
};
