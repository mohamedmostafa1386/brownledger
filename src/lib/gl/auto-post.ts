/**
 * Auto-Posting Service for General Ledger
 * Creates journal entries for all business transactions
 */

import { prisma } from "@/lib/prisma";

interface JournalLine {
    accountId: string;
    description?: string;
    debit?: number;
    credit?: number;
}

/**
 * Create a journal entry with validation
 */
export async function createJournalEntry(
    companyId: string,
    sourceType: string,
    sourceId: string,
    description: string,
    lines: JournalLine[],
    entryDate?: Date
) {
    // Calculate totals
    const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);

    // Validate debits = credits
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Journal entry is unbalanced: Debits (${totalDebit}) != Credits (${totalCredit})`);
    }

    // Generate journal number
    const count = await prisma.journalEntry.count({ where: { companyId } });
    const journalNumber = `JE-${String(count + 1).padStart(6, "0")}`;

    // Create journal entry with lines
    const entry = await prisma.journalEntry.create({
        data: {
            companyId,
            journalNumber,
            entryDate: entryDate || new Date(),
            description,
            sourceType: sourceType as any,
            sourceId,
            status: "POSTED",
            totalDebit,
            totalCredit,
            lines: {
                create: lines.map(line => ({
                    accountId: line.accountId,
                    description: line.description,
                    debit: line.debit || 0,
                    credit: line.credit || 0,
                })),
            },
        },
        include: { lines: true },
    });

    // Update account balances
    for (const line of lines) {
        const account = await prisma.account.findUnique({ where: { id: line.accountId } });
        if (account) {
            const change = (line.debit || 0) - (line.credit || 0);
            const balanceChange = account.normalBalance === "DEBIT" ? change : -change;
            await prisma.account.update({
                where: { id: line.accountId },
                data: { currentBalance: { increment: balanceChange } },
            });
        }
    }

    return entry;
}

/**
 * Get default accounts for a company
 */
async function getDefaultAccounts(companyId: string) {
    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: {
            cashAccountId: true,
            arAccountId: true,
            apAccountId: true,
            salesAccountId: true,
            salesTaxAccountId: true,
            cogsAccountId: true,
            inventoryAccountId: true,
        },
    });

    if (!company) throw new Error("Company not found");

    // If no defaults, try to find by account code
    const findByCode = async (code: string) => {
        const account = await prisma.account.findFirst({
            where: { companyId, accountCode: code },
        });
        return account?.id;
    };

    return {
        cash: company.cashAccountId || await findByCode("1000"),
        ar: company.arAccountId || await findByCode("1100"),
        ap: company.apAccountId || await findByCode("2000"),
        sales: company.salesAccountId || await findByCode("4000"),
        salesTax: company.salesTaxAccountId || await findByCode("2100"),
        cogs: company.cogsAccountId || await findByCode("5000"),
        inventory: company.inventoryAccountId || await findByCode("1200"),
    };
}

/**
 * Auto-post Invoice (when status changes to SENT)
 * DR: Accounts Receivable
 *   CR: Sales Revenue
 *   CR: Sales Tax Payable (if applicable)
 */
export async function postInvoiceToGL(invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { items: true, client: true },
    });

    if (!invoice || invoice.isPostedToGL) return null;

    const accounts = await getDefaultAccounts(invoice.companyId);
    if (!accounts.ar || !accounts.sales) {
        throw new Error("Missing required GL accounts (AR or Sales)");
    }

    // Calculate amounts
    const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * (invoice.taxRate / 100);
    const total = subtotal + taxAmount;

    const lines: JournalLine[] = [
        { accountId: accounts.ar, debit: total, description: `Invoice to ${invoice.client.name}` },
        { accountId: accounts.sales, credit: subtotal, description: "Sales Revenue" },
    ];

    if (taxAmount > 0 && accounts.salesTax) {
        lines.push({ accountId: accounts.salesTax, credit: taxAmount, description: "Sales Tax Payable" });
    }

    const entry = await createJournalEntry(
        invoice.companyId,
        "INVOICE",
        invoice.id,
        `Invoice ${invoice.invoiceNumber} to ${invoice.client.name}`,
        lines,
        invoice.issueDate
    );

    // Update invoice
    await prisma.invoice.update({
        where: { id: invoiceId },
        data: { journalEntryId: entry.id, isPostedToGL: true },
    });

    return entry;
}

/**
 * Auto-post Payment Received
 * DR: Cash/Bank
 *   CR: Accounts Receivable
 */
export async function postPaymentReceivedToGL(paymentId: string) {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { client: true },
    });

    if (!payment || payment.isPostedToGL) return null;

    const accounts = await getDefaultAccounts(payment.companyId);
    if (!accounts.cash || !accounts.ar) {
        throw new Error("Missing required GL accounts (Cash or AR)");
    }

    const lines: JournalLine[] = [
        { accountId: accounts.cash, debit: payment.totalAmount, description: `Payment from ${payment.client.name}` },
        { accountId: accounts.ar, credit: payment.totalAmount, description: "Reduce AR" },
    ];

    const entry = await createJournalEntry(
        payment.companyId,
        "PAYMENT_RECEIVED",
        payment.id,
        `Payment ${payment.paymentNumber} from ${payment.client.name}`,
        lines,
        payment.paymentDate
    );

    await prisma.payment.update({
        where: { id: paymentId },
        data: { journalEntryId: entry.id, isPostedToGL: true },
    });

    return entry;
}

/**
 * Auto-post Bill (Supplier Invoice)
 * DR: Purchases/Inventory
 * DR: Tax (if applicable)
 *   CR: Accounts Payable
 */
export async function postBillToGL(billId: string) {
    const bill = await prisma.bill.findUnique({
        where: { id: billId },
        include: { items: true, supplier: true },
    });

    if (!bill || bill.isPostedToGL) return null;

    const accounts = await getDefaultAccounts(bill.companyId);
    if (!accounts.cogs || !accounts.ap) {
        throw new Error("Missing required GL accounts (COGS/Inventory or AP)");
    }

    const subtotal = bill.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * (bill.taxRate / 100);
    const total = subtotal + taxAmount;

    const lines: JournalLine[] = [
        { accountId: accounts.cogs, debit: subtotal, description: `Purchase from ${bill.supplier.name}` },
        { accountId: accounts.ap, credit: total, description: "Accounts Payable" },
    ];

    if (taxAmount > 0 && accounts.salesTax) {
        lines.push({ accountId: accounts.salesTax, debit: taxAmount, description: "Tax Paid" });
    }

    const entry = await createJournalEntry(
        bill.companyId,
        "BILL",
        bill.id,
        `Bill ${bill.billNumber} from ${bill.supplier.name}`,
        lines,
        bill.issueDate
    );

    await prisma.bill.update({
        where: { id: billId },
        data: { journalEntryId: entry.id, isPostedToGL: true },
    });

    return entry;
}

/**
 * Auto-post POS Sale
 * DR: Cash
 *   CR: Sales Revenue
 *   CR: Sales Tax Payable
 * 
 * DR: COGS
 *   CR: Inventory
 */
export async function postPOSSaleToGL(saleId: string) {
    const sale = await prisma.pOSSale.findUnique({
        where: { id: saleId },
        include: { items: true },
    });

    if (!sale || sale.isPostedToGL) return null;

    const accounts = await getDefaultAccounts(sale.companyId);
    if (!accounts.cash || !accounts.sales) {
        throw new Error("Missing required GL accounts");
    }

    // Revenue entry
    const lines: JournalLine[] = [
        { accountId: accounts.cash, debit: sale.total, description: `POS Sale ${sale.saleNumber}` },
        { accountId: accounts.sales, credit: sale.subtotal, description: "Sales Revenue" },
    ];

    if (sale.taxAmount > 0 && accounts.salesTax) {
        lines.push({ accountId: accounts.salesTax, credit: sale.taxAmount, description: "Sales Tax" });
    }

    // COGS entry (if inventory tracking)
    if (accounts.cogs && accounts.inventory) {
        const costOfGoods = sale.items.reduce((sum, item) => {
            // Approximate cost as 60% of sale price (should get actual cost from products)
            return sum + (item.unitPrice * item.quantity * 0.6);
        }, 0);

        if (costOfGoods > 0) {
            lines.push({ accountId: accounts.cogs, debit: costOfGoods, description: "Cost of Goods Sold" });
            lines.push({ accountId: accounts.inventory, credit: costOfGoods, description: "Reduce Inventory" });
        }
    }

    const entry = await createJournalEntry(
        sale.companyId,
        "POS_SALE",
        sale.id,
        `POS Sale ${sale.saleNumber}`,
        lines,
        sale.saleDate
    );

    await prisma.pOSSale.update({
        where: { id: saleId },
        data: { journalEntryId: entry.id, isPostedToGL: true },
    });

    return entry;
}

/**
 * Seed default Chart of Accounts for a company
 */
export async function seedDefaultChartOfAccounts(companyId: string) {
    const accounts = [
        // Assets (1000-1999)
        { code: "1000", name: "Cash", nameAr: "النقدية", type: "ASSET", category: "CURRENT_ASSET", normal: "DEBIT" },
        { code: "1010", name: "Cash Register", nameAr: "صندوق النقد", type: "ASSET", category: "CURRENT_ASSET", normal: "DEBIT" },
        { code: "1020", name: "Bank", nameAr: "البنك", type: "ASSET", category: "CURRENT_ASSET", normal: "DEBIT" },
        { code: "1100", name: "Accounts Receivable", nameAr: "الذمم المدينة", type: "ASSET", category: "CURRENT_ASSET", normal: "DEBIT" },
        { code: "1200", name: "Inventory", nameAr: "المخزون", type: "ASSET", category: "CURRENT_ASSET", normal: "DEBIT" },
        { code: "1500", name: "Fixed Assets", nameAr: "الأصول الثابتة", type: "ASSET", category: "FIXED_ASSET", normal: "DEBIT" },

        // Liabilities (2000-2999)
        { code: "2000", name: "Accounts Payable", nameAr: "الذمم الدائنة", type: "LIABILITY", category: "CURRENT_LIABILITY", normal: "CREDIT" },
        { code: "2100", name: "Sales Tax Payable", nameAr: "ضريبة المبيعات", type: "LIABILITY", category: "CURRENT_LIABILITY", normal: "CREDIT" },
        { code: "2500", name: "Long-term Debt", nameAr: "الديون طويلة الأجل", type: "LIABILITY", category: "LONG_TERM_LIABILITY", normal: "CREDIT" },

        // Equity (3000-3999)
        { code: "3000", name: "Owner's Capital", nameAr: "رأس المال", type: "EQUITY", category: "CAPITAL", normal: "CREDIT" },
        { code: "3100", name: "Retained Earnings", nameAr: "الأرباح المحتجزة", type: "EQUITY", category: "RETAINED_EARNINGS", normal: "CREDIT" },

        // Revenue (4000-4999)
        { code: "4000", name: "Sales Revenue", nameAr: "إيرادات المبيعات", type: "REVENUE", category: "OPERATING_REVENUE", normal: "CREDIT" },
        { code: "4100", name: "Service Revenue", nameAr: "إيرادات الخدمات", type: "REVENUE", category: "OPERATING_REVENUE", normal: "CREDIT" },
        { code: "4500", name: "Other Income", nameAr: "إيرادات أخرى", type: "REVENUE", category: "OTHER_INCOME", normal: "CREDIT" },

        // Expenses (5000-5999)
        { code: "5000", name: "Cost of Goods Sold", nameAr: "تكلفة المبيعات", type: "EXPENSE", category: "COST_OF_GOODS_SOLD", normal: "DEBIT" },
        { code: "5100", name: "Salaries & Wages", nameAr: "الرواتب والأجور", type: "EXPENSE", category: "OPERATING_EXPENSE", normal: "DEBIT" },
        { code: "5200", name: "Rent Expense", nameAr: "مصروف الإيجار", type: "EXPENSE", category: "OPERATING_EXPENSE", normal: "DEBIT" },
        { code: "5300", name: "Utilities", nameAr: "المرافق", type: "EXPENSE", category: "OPERATING_EXPENSE", normal: "DEBIT" },
        { code: "5400", name: "Marketing & Advertising", nameAr: "التسويق والإعلان", type: "EXPENSE", category: "OPERATING_EXPENSE", normal: "DEBIT" },
        { code: "5500", name: "Office Supplies", nameAr: "مستلزمات المكتب", type: "EXPENSE", category: "OPERATING_EXPENSE", normal: "DEBIT" },
        { code: "5900", name: "Other Expenses", nameAr: "مصروفات أخرى", type: "EXPENSE", category: "OTHER_EXPENSE", normal: "DEBIT" },
    ];

    for (const acc of accounts) {
        await prisma.account.upsert({
            where: { companyId_accountCode: { companyId, accountCode: acc.code } },
            create: {
                companyId,
                accountCode: acc.code,
                accountName: acc.name,
                accountNameAr: acc.nameAr,
                accountType: acc.type as any,
                accountCategory: acc.category as any,
                normalBalance: acc.normal as any,
            },
            update: {},
        });
    }

    // Set default accounts for company
    const cash = await prisma.account.findFirst({ where: { companyId, accountCode: "1000" } });
    const ar = await prisma.account.findFirst({ where: { companyId, accountCode: "1100" } });
    const ap = await prisma.account.findFirst({ where: { companyId, accountCode: "2000" } });
    const sales = await prisma.account.findFirst({ where: { companyId, accountCode: "4000" } });
    const salesTax = await prisma.account.findFirst({ where: { companyId, accountCode: "2100" } });
    const cogs = await prisma.account.findFirst({ where: { companyId, accountCode: "5000" } });
    const inventory = await prisma.account.findFirst({ where: { companyId, accountCode: "1200" } });

    await prisma.company.update({
        where: { id: companyId },
        data: {
            cashAccountId: cash?.id,
            arAccountId: ar?.id,
            apAccountId: ap?.id,
            salesAccountId: sales?.id,
            salesTaxAccountId: salesTax?.id,
            cogsAccountId: cogs?.id,
            inventoryAccountId: inventory?.id,
        },
    });

    return accounts.length;
}
