/**
 * financial-core.ts - Centralized Financial Calculations
 * 
 * Single source of truth for all financial metrics across BrownLedger.
 * Used by Dashboard, Reports, and Financial Statements APIs.
 */

import { prisma } from "@/lib/prisma";

export interface DateRange {
    startDate: Date;
    endDate: Date;
}

export interface FinancialSummary {
    revenue: number;
    cogs: number;
    grossProfit: number;
    operatingExpenses: number;
    netProfit: number;
    cashBalance: number;
    accountsReceivable: number;
    accountsPayable: number;
}

export interface MonthlyData {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
}

/**
 * Get default date range (current fiscal year)
 */
export function getDefaultDateRange(): DateRange {
    const now = new Date();
    return {
        startDate: new Date(now.getFullYear(), 0, 1), // Jan 1
        endDate: now,
    };
}

/**
 * Calculate Revenue from PAID invoices + COMPLETED POS sales
 */
export async function calculateRevenue(
    companyId: string,
    startDate?: Date,
    endDate?: Date
): Promise<number> {
    const { startDate: start, endDate: end } = startDate && endDate
        ? { startDate, endDate }
        : getDefaultDateRange();

    // Revenue from PAID invoices
    const paidInvoices = await prisma.invoice.findMany({
        where: {
            companyId,
            status: "PAID",
            issueDate: { gte: start, lte: end },
        },
        include: { items: true },
    });

    const invoiceRevenue = paidInvoices.reduce((sum, inv) => {
        const subtotal = inv.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
        const taxAmount = subtotal * (inv.taxRate || 0);
        return sum + subtotal + taxAmount;
    }, 0);

    // Revenue from COMPLETED POS sales
    const posSales = await prisma.pOSSale.findMany({
        where: {
            companyId,
            status: "COMPLETED",
            saleDate: { gte: start, lte: end },
        },
    });

    const posRevenue = posSales.reduce((sum, sale) => sum + sale.total, 0);

    return invoiceRevenue + posRevenue;
}

/**
 * Calculate Cost of Goods Sold (product cost for sold items)
 */
export async function calculateCOGS(
    companyId: string,
    startDate?: Date,
    endDate?: Date
): Promise<number> {
    const { startDate: start, endDate: end } = startDate && endDate
        ? { startDate, endDate }
        : getDefaultDateRange();

    // COGS from POS sales (using product cost prices)
    const posSales = await prisma.pOSSale.findMany({
        where: {
            companyId,
            status: "COMPLETED",
            saleDate: { gte: start, lte: end },
        },
        include: {
            items: {
                include: { product: true }
            }
        },
    });

    const posCogs = posSales.reduce((sum, sale) => {
        return sum + sale.items.reduce((itemSum, item) => {
            return itemSum + (item.quantity * (item.product?.costPrice || 0));
        }, 0);
    }, 0);

    // Additional COGS from invoice items (if products are linked)
    // For now, estimate as 60% of invoice revenue (common margin)
    const paidInvoices = await prisma.invoice.findMany({
        where: {
            companyId,
            status: "PAID",
            issueDate: { gte: start, lte: end },
        },
        include: { items: true },
    });

    const invoiceRevenue = paidInvoices.reduce((sum, inv) => {
        return sum + inv.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
    }, 0);

    // Estimate invoice COGS at 60% (manufacturing/metalwork typical margin)
    const invoiceCogs = invoiceRevenue * 0.6;

    return posCogs + invoiceCogs;
}

/**
 * Calculate Operating Expenses from Expense records + PAID Bills
 */
export async function calculateExpenses(
    companyId: string,
    startDate?: Date,
    endDate?: Date
): Promise<number> {
    const { startDate: start, endDate: end } = startDate && endDate
        ? { startDate, endDate }
        : getDefaultDateRange();

    // Operating expenses from Expense records
    const expenses = await prisma.expense.findMany({
        where: {
            companyId,
            date: { gte: start, lte: end },
        },
    });

    const expenseTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Add paid bills (purchases)
    const paidBills = await prisma.bill.findMany({
        where: {
            companyId,
            status: "PAID",
            issueDate: { gte: start, lte: end },
        },
    });

    const billsTotal = paidBills.reduce((sum, bill) => sum + bill.totalAmount, 0);

    return expenseTotal + billsTotal;
}

/**
 * Get comprehensive financial summary
 */
export async function getFinancialSummary(
    companyId: string,
    startDate?: Date,
    endDate?: Date
): Promise<FinancialSummary> {
    const revenue = await calculateRevenue(companyId, startDate, endDate);
    const cogs = await calculateCOGS(companyId, startDate, endDate);
    const operatingExpenses = await calculateExpenses(companyId, startDate, endDate);

    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - operatingExpenses;

    // Cash balance from bank accounts
    const bankAccounts = await prisma.bankAccount.findMany({
        where: { companyId },
    });
    const cashBalance = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Accounts Receivable (unpaid + overdue invoices)
    const arInvoices = await prisma.invoice.findMany({
        where: {
            companyId,
            status: { in: ["PENDING", "OVERDUE", "SENT"] },
        },
        include: { items: true },
    });
    const accountsReceivable = arInvoices.reduce((sum, inv) => {
        const subtotal = inv.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
        return sum + subtotal * (1 + (inv.taxRate || 0));
    }, 0);

    // Accounts Payable (unpaid bills)
    const apBills = await prisma.bill.findMany({
        where: {
            companyId,
            status: { in: ["PENDING", "OVERDUE"] },
        },
    });
    const accountsPayable = apBills.reduce((sum, bill) => sum + bill.totalAmount - bill.paidAmount, 0);

    return {
        revenue: Math.round(revenue),
        cogs: Math.round(cogs),
        grossProfit: Math.round(grossProfit),
        operatingExpenses: Math.round(operatingExpenses),
        netProfit: Math.round(netProfit),
        cashBalance: Math.round(cashBalance),
        accountsReceivable: Math.round(accountsReceivable),
        accountsPayable: Math.round(accountsPayable),
    };
}

/**
 * Get monthly aggregated data for charts
 */
export async function getMonthlyData(
    companyId: string,
    monthsBack: number = 12
): Promise<MonthlyData[]> {
    const now = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const result: MonthlyData[] = [];

    // Get all relevant data in one query
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);

    const invoices = await prisma.invoice.findMany({
        where: {
            companyId,
            status: "PAID",
            issueDate: { gte: startDate },
        },
        include: { items: true },
    });

    const posSales = await prisma.pOSSale.findMany({
        where: {
            companyId,
            status: "COMPLETED",
            saleDate: { gte: startDate },
        },
    });

    const expenses = await prisma.expense.findMany({
        where: {
            companyId,
            date: { gte: startDate },
        },
    });

    // Aggregate by month
    const monthlyMap = new Map<string, { revenue: number; expenses: number }>();

    // Initialize all months
    for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthlyMap.set(key, { revenue: 0, expenses: 0 });
    }

    // Add invoice revenue
    invoices.forEach(inv => {
        const key = `${inv.issueDate.getFullYear()}-${inv.issueDate.getMonth()}`;
        const current = monthlyMap.get(key) || { revenue: 0, expenses: 0 };
        const subtotal = inv.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
        current.revenue += subtotal * (1 + (inv.taxRate || 0));
        monthlyMap.set(key, current);
    });

    // Add POS revenue
    posSales.forEach(sale => {
        const key = `${sale.saleDate.getFullYear()}-${sale.saleDate.getMonth()}`;
        const current = monthlyMap.get(key) || { revenue: 0, expenses: 0 };
        current.revenue += sale.total;
        monthlyMap.set(key, current);
    });

    // Add expenses
    expenses.forEach(exp => {
        const key = `${exp.date.getFullYear()}-${exp.date.getMonth()}`;
        const current = monthlyMap.get(key) || { revenue: 0, expenses: 0 };
        current.expenses += exp.amount;
        monthlyMap.set(key, current);
    });

    // Convert to array
    for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const data = monthlyMap.get(key) || { revenue: 0, expenses: 0 };
        result.push({
            month: months[d.getMonth()],
            revenue: Math.round(data.revenue),
            expenses: Math.round(data.expenses),
            profit: Math.round(data.revenue - data.expenses),
        });
    }

    return result;
}

/**
 * Get top clients by revenue
 */
export async function getTopClients(
    companyId: string,
    limit: number = 5,
    startDate?: Date,
    endDate?: Date
): Promise<{ name: string; value: number; count: number }[]> {
    const { startDate: start, endDate: end } = startDate && endDate
        ? { startDate, endDate }
        : getDefaultDateRange();

    const invoices = await prisma.invoice.findMany({
        where: {
            companyId,
            status: "PAID",
            issueDate: { gte: start, lte: end },
        },
        include: { items: true, client: true },
    });

    const clientMap = new Map<string, { value: number; count: number }>();
    invoices.forEach(inv => {
        const current = clientMap.get(inv.client.name) || { value: 0, count: 0 };
        const subtotal = inv.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
        current.value += subtotal * (1 + (inv.taxRate || 0));
        current.count++;
        clientMap.set(inv.client.name, current);
    });

    return Array.from(clientMap.entries())
        .map(([name, data]) => ({ name, value: Math.round(data.value), count: data.count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);
}

/**
 * Get top suppliers by spend
 */
export async function getTopSuppliers(
    companyId: string,
    limit: number = 5,
    startDate?: Date,
    endDate?: Date
): Promise<{ name: string; value: number; count: number }[]> {
    const { startDate: start, endDate: end } = startDate && endDate
        ? { startDate, endDate }
        : getDefaultDateRange();

    const bills = await prisma.bill.findMany({
        where: {
            companyId,
            issueDate: { gte: start, lte: end },
        },
        include: { supplier: true },
    });

    const supplierMap = new Map<string, { value: number; count: number }>();
    bills.forEach(bill => {
        const current = supplierMap.get(bill.supplier.name) || { value: 0, count: 0 };
        current.value += bill.totalAmount;
        current.count++;
        supplierMap.set(bill.supplier.name, current);
    });

    return Array.from(supplierMap.entries())
        .map(([name, data]) => ({ name, value: Math.round(data.value), count: data.count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);
}

/**
 * Get expenses by category
 */
export async function getExpensesByCategory(
    companyId: string,
    limit: number = 5,
    startDate?: Date,
    endDate?: Date
): Promise<{ name: string; value: number }[]> {
    const { startDate: start, endDate: end } = startDate && endDate
        ? { startDate, endDate }
        : getDefaultDateRange();

    const expenses = await prisma.expense.findMany({
        where: {
            companyId,
            date: { gte: start, lte: end },
        },
        include: { category: true },
    });

    const categoryMap = new Map<string, number>();
    expenses.forEach(exp => {
        const catName = exp.category?.name || "Uncategorized";
        categoryMap.set(catName, (categoryMap.get(catName) || 0) + exp.amount);
    });

    return Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value: Math.round(value) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit);
}

/**
 * Get inventory summary
 */
export async function getInventorySummary(companyId: string): Promise<{
    totalValue: number;
    itemCount: number;
    lowStockCount: number;
    outOfStockCount: number;
}> {
    const products = await prisma.product.findMany({
        where: { companyId, isActive: true },
    });

    return {
        totalValue: Math.round(products.reduce((sum, p) => sum + p.stockQuantity * p.costPrice, 0)),
        itemCount: products.length,
        lowStockCount: products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockAlert).length,
        outOfStockCount: products.filter(p => p.stockQuantity === 0).length,
    };
}

/**
 * Get AR aging buckets
 */
export async function getARAgingBuckets(companyId: string): Promise<{
    bucket: string;
    amount: number;
    count: number;
}[]> {
    const now = new Date();
    const invoices = await prisma.invoice.findMany({
        where: {
            companyId,
            status: { in: ["PENDING", "OVERDUE", "SENT"] },
        },
        include: { items: true },
    });

    const buckets = {
        current: { amount: 0, count: 0 },
        "1-30": { amount: 0, count: 0 },
        "31-60": { amount: 0, count: 0 },
        "61-90": { amount: 0, count: 0 },
        "90+": { amount: 0, count: 0 },
    };

    invoices.forEach(inv => {
        const subtotal = inv.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
        const total = subtotal * (1 + (inv.taxRate || 0));
        const daysOverdue = Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24));

        let bucket: keyof typeof buckets;
        if (daysOverdue <= 0) bucket = "current";
        else if (daysOverdue <= 30) bucket = "1-30";
        else if (daysOverdue <= 60) bucket = "31-60";
        else if (daysOverdue <= 90) bucket = "61-90";
        else bucket = "90+";

        buckets[bucket].amount += total;
        buckets[bucket].count++;
    });

    return Object.entries(buckets).map(([bucket, data]) => ({
        bucket,
        amount: Math.round(data.amount),
        count: data.count,
    }));
}
