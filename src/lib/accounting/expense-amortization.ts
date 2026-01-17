/**
 * expense-amortization.ts - Prepaid Expense Amortization
 * 
 * Handles the recognition of prepaid expenses over time.
 * Example: 3-year hosting paid EGP 36,000 upfront → EGP 1,000/month expense
 */

import { prisma } from "@/lib/prisma";

export interface CreatePrepaidExpenseInput {
    companyId: string;
    description: string;
    vendorName?: string;
    referenceNumber?: string;
    totalAmount: number;
    startDate: Date;
    endDate: Date;
    expenseAccountId?: string;  // e.g., "6xxx" for hosting expense
    assetAccountId?: string;    // e.g., "1300" for prepaid expenses
    notes?: string;
}

export interface AmortizationScheduleEntry {
    periodNumber: number;
    periodDate: Date;
    amount: number;
    cumulativeRecognized: number;
    remainingBalance: number;
    isProcessed: boolean;
}

/**
 * Calculate the number of months between two dates
 */
export function calculateMonthsBetween(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const months = (end.getFullYear() - start.getFullYear()) * 12
        + (end.getMonth() - start.getMonth()) + 1;

    return Math.max(1, months);
}

/**
 * Create a new prepaid expense with amortization schedule
 */
export async function createPrepaidExpense(input: CreatePrepaidExpenseInput) {
    const periodMonths = calculateMonthsBetween(input.startDate, input.endDate);
    const monthlyAmount = Math.round((input.totalAmount / periodMonths) * 100) / 100;

    // Create the prepaid expense record
    const prepaidExpense = await prisma.prepaidExpense.create({
        data: {
            companyId: input.companyId,
            description: input.description,
            vendorName: input.vendorName,
            referenceNumber: input.referenceNumber,
            totalAmount: input.totalAmount,
            startDate: input.startDate,
            endDate: input.endDate,
            periodMonths,
            monthlyAmount,
            recognizedAmount: 0,
            remainingAmount: input.totalAmount,
            expenseAccountId: input.expenseAccountId,
            assetAccountId: input.assetAccountId,
            notes: input.notes,
            isActive: true,
        },
    });

    // Generate amortization schedule entries
    const scheduleEntries = [];
    let currentDate = new Date(input.startDate);

    for (let i = 0; i < periodMonths; i++) {
        // Handle last month rounding adjustment
        const isLastMonth = i === periodMonths - 1;
        const amount = isLastMonth
            ? input.totalAmount - (monthlyAmount * (periodMonths - 1))
            : monthlyAmount;

        scheduleEntries.push({
            prepaidExpenseId: prepaidExpense.id,
            periodDate: new Date(currentDate),
            amount: Math.round(amount * 100) / 100,
            isProcessed: false,
        });

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Bulk create schedule entries
    await prisma.expenseAmortization.createMany({
        data: scheduleEntries,
    });

    return prepaidExpense;
}

/**
 * Get amortization schedule for a prepaid expense
 */
export async function getAmortizationSchedule(
    prepaidExpenseId: string
): Promise<AmortizationScheduleEntry[]> {
    const prepaid = await prisma.prepaidExpense.findUnique({
        where: { id: prepaidExpenseId },
        include: { amortizations: { orderBy: { periodDate: "asc" } } },
    });

    if (!prepaid) return [];

    let cumulativeRecognized = 0;

    return prepaid.amortizations.map((entry, index) => {
        cumulativeRecognized += entry.amount;
        return {
            periodNumber: index + 1,
            periodDate: entry.periodDate,
            amount: entry.amount,
            cumulativeRecognized,
            remainingBalance: prepaid.totalAmount - cumulativeRecognized,
            isProcessed: entry.isProcessed,
        };
    });
}

/**
 * Process (recognize) an amortization entry
 * Creates journal entry: DR Expense, CR Prepaid Asset
 */
export async function processAmortizationEntry(
    amortizationId: string,
    journalEntryId?: string
) {
    const entry = await prisma.expenseAmortization.findUnique({
        where: { id: amortizationId },
        include: { prepaidExpense: true },
    });

    if (!entry) throw new Error("Amortization entry not found");
    if (entry.isProcessed) throw new Error("Already processed");

    // Update the amortization entry
    await prisma.expenseAmortization.update({
        where: { id: amortizationId },
        data: {
            isProcessed: true,
            journalEntryId,
        },
    });

    // Update the prepaid expense totals
    await prisma.prepaidExpense.update({
        where: { id: entry.prepaidExpenseId },
        data: {
            recognizedAmount: { increment: entry.amount },
            remainingAmount: { decrement: entry.amount },
            lastRecognizedAt: new Date(),
        },
    });

    return { success: true, amount: entry.amount };
}

/**
 * Get pending amortization entries for a period
 */
export async function getPendingAmortizations(
    companyId: string,
    asOfDate?: Date
) {
    const date = asOfDate || new Date();

    const pendingEntries = await prisma.expenseAmortization.findMany({
        where: {
            isProcessed: false,
            periodDate: { lte: date },
            prepaidExpense: {
                companyId,
                isActive: true,
            },
        },
        include: {
            prepaidExpense: true,
        },
        orderBy: { periodDate: "asc" },
    });

    return pendingEntries;
}

/**
 * Process all pending amortizations up to a date
 */
export async function processAllPendingAmortizations(
    companyId: string,
    asOfDate?: Date
) {
    const pending = await getPendingAmortizations(companyId, asOfDate);

    const results = [];
    for (const entry of pending) {
        const result = await processAmortizationEntry(entry.id);
        results.push({
            prepaidExpenseId: entry.prepaidExpenseId,
            description: entry.prepaidExpense.description,
            ...result,
        });
    }

    return results;
}

/**
 * Get all prepaid expenses for a company
 */
export async function getPrepaidExpenses(companyId: string) {
    return prisma.prepaidExpense.findMany({
        where: { companyId },
        include: {
            amortizations: {
                orderBy: { periodDate: "asc" },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

export default {
    createPrepaidExpense,
    getAmortizationSchedule,
    processAmortizationEntry,
    getPendingAmortizations,
    processAllPendingAmortizations,
    getPrepaidExpenses,
    calculateMonthsBetween,
};
