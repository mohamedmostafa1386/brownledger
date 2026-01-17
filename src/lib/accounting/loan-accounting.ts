/**
 * loan-accounting.ts - Loan and Interest Recognition
 * 
 * Handles loan accounting including:
 * - Principal and interest tracking
 * - Amortization schedule generation
 * - Payment recording with interest/principal split
 * - Interest accrual
 */

import { prisma } from "@/lib/prisma";

export interface CreateLoanInput {
    companyId: string;
    loanName: string;
    lenderName: string;
    referenceNumber?: string;
    principalAmount: number;
    interestRate: number;       // Annual rate as decimal (0.12 = 12%)
    interestType?: "SIMPLE" | "COMPOUND";
    startDate: Date;
    termMonths: number;
    paymentFrequency?: "MONTHLY" | "QUARTERLY" | "SEMI_ANNUALLY" | "ANNUALLY";
    loanAccountId?: string;     // Liability account (e.g., 2500)
    interestAccountId?: string; // Interest expense account (e.g., 6800)
    notes?: string;
}

export interface LoanScheduleEntry {
    periodNumber: number;
    dueDate: Date;
    principalDue: number;
    interestDue: number;
    totalDue: number;
    balanceAfter: number;
    isPaid: boolean;
}

export interface PaymentAllocation {
    principalPart: number;
    interestPart: number;
    totalPayment: number;
}

/**
 * Calculate monthly payment for an amortized loan
 * Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateMonthlyPayment(
    principal: number,
    annualRate: number,
    termMonths: number
): number {
    if (annualRate === 0) {
        return principal / termMonths;
    }

    const monthlyRate = annualRate / 12;
    const factor = Math.pow(1 + monthlyRate, termMonths);
    const payment = principal * (monthlyRate * factor) / (factor - 1);

    return Math.round(payment * 100) / 100;
}

/**
 * Calculate total interest over the life of the loan
 */
export function calculateTotalInterest(
    principal: number,
    annualRate: number,
    termMonths: number,
    interestType: string = "SIMPLE"
): number {
    if (interestType === "SIMPLE") {
        // Simple interest: I = P * r * t
        const years = termMonths / 12;
        return Math.round(principal * annualRate * years * 100) / 100;
    } else {
        // Compound interest: total payments - principal
        const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
        const totalPayments = monthlyPayment * termMonths;
        return Math.round((totalPayments - principal) * 100) / 100;
    }
}

/**
 * Generate amortization schedule for a loan
 */
export function generateAmortizationSchedule(
    principal: number,
    annualRate: number,
    termMonths: number,
    startDate: Date,
    paymentFrequency: string = "MONTHLY"
): LoanScheduleEntry[] {
    const schedule: LoanScheduleEntry[] = [];
    const monthlyRate = annualRate / 12;
    const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);

    let balance = principal;
    let currentDate = new Date(startDate);

    // Determine months between payments
    const monthsPerPayment =
        paymentFrequency === "QUARTERLY" ? 3 :
            paymentFrequency === "SEMI_ANNUALLY" ? 6 :
                paymentFrequency === "ANNUALLY" ? 12 : 1;

    const numPayments = Math.ceil(termMonths / monthsPerPayment);
    const paymentAmount = monthlyPayment * monthsPerPayment;

    for (let i = 0; i < numPayments; i++) {
        // Calculate interest for this period
        const periodInterest = balance * monthlyRate * monthsPerPayment;

        // Calculate principal portion
        const isLastPayment = i === numPayments - 1;
        const principalPart = isLastPayment
            ? balance
            : Math.min(paymentAmount - periodInterest, balance);

        const actualPayment = isLastPayment
            ? balance + periodInterest
            : paymentAmount;

        balance -= principalPart;

        // Move to payment date
        currentDate.setMonth(currentDate.getMonth() + monthsPerPayment);

        schedule.push({
            periodNumber: i + 1,
            dueDate: new Date(currentDate),
            principalDue: Math.round(principalPart * 100) / 100,
            interestDue: Math.round(periodInterest * 100) / 100,
            totalDue: Math.round(actualPayment * 100) / 100,
            balanceAfter: Math.max(0, Math.round(balance * 100) / 100),
            isPaid: false,
        });
    }

    return schedule;
}

/**
 * Create a new loan with amortization schedule
 */
export async function createLoan(input: CreateLoanInput) {
    const interestType = input.interestType || "COMPOUND";
    const paymentFrequency = input.paymentFrequency || "MONTHLY";

    // Calculate end date
    const endDate = new Date(input.startDate);
    endDate.setMonth(endDate.getMonth() + input.termMonths);

    // Calculate monthly payment and total interest
    const monthlyPayment = calculateMonthlyPayment(
        input.principalAmount,
        input.interestRate,
        input.termMonths
    );
    const totalInterest = calculateTotalInterest(
        input.principalAmount,
        input.interestRate,
        input.termMonths,
        interestType
    );

    // Create the loan record
    const loan = await prisma.loan.create({
        data: {
            companyId: input.companyId,
            loanName: input.loanName,
            lenderName: input.lenderName,
            referenceNumber: input.referenceNumber,
            principalAmount: input.principalAmount,
            interestRate: input.interestRate,
            interestType,
            startDate: input.startDate,
            endDate,
            termMonths: input.termMonths,
            paymentFrequency,
            monthlyPayment,
            totalInterest,
            totalPaid: 0,
            principalPaid: 0,
            interestPaid: 0,
            remainingBalance: input.principalAmount,
            loanAccountId: input.loanAccountId,
            interestAccountId: input.interestAccountId,
            isActive: true,
            notes: input.notes,
        },
    });

    // Generate and save the amortization schedule
    const schedule = generateAmortizationSchedule(
        input.principalAmount,
        input.interestRate,
        input.termMonths,
        input.startDate,
        paymentFrequency
    );

    await prisma.loanSchedule.createMany({
        data: schedule.map(entry => ({
            loanId: loan.id,
            periodNumber: entry.periodNumber,
            dueDate: entry.dueDate,
            principalDue: entry.principalDue,
            interestDue: entry.interestDue,
            totalDue: entry.totalDue,
            balanceAfter: entry.balanceAfter,
            isPaid: false,
        })),
    });

    return loan;
}

/**
 * Get loan with schedule
 */
export async function getLoanWithSchedule(loanId: string) {
    return prisma.loan.findUnique({
        where: { id: loanId },
        include: {
            schedule: { orderBy: { periodNumber: "asc" } },
            payments: { orderBy: { paymentDate: "asc" } },
        },
    });
}

/**
 * Record a loan payment
 */
export async function recordLoanPayment(
    loanId: string,
    paymentDate: Date,
    totalPayment: number,
    journalEntryId?: string,
    notes?: string
) {
    const loan = await prisma.loan.findUnique({
        where: { id: loanId },
        include: { schedule: { where: { isPaid: false }, orderBy: { periodNumber: "asc" } } },
    });

    if (!loan) throw new Error("Loan not found");
    if (loan.remainingBalance <= 0) throw new Error("Loan already fully paid");

    // Calculate interest for period since last payment
    const monthlyRate = loan.interestRate / 12;
    const interestDue = loan.remainingBalance * monthlyRate;

    // Split payment between interest and principal
    const interestPart = Math.min(interestDue, totalPayment);
    const principalPart = totalPayment - interestPart;
    const newBalance = Math.max(0, loan.remainingBalance - principalPart);

    // Get payment number
    const paymentCount = await prisma.loanPayment.count({ where: { loanId } });

    // Create payment record
    const payment = await prisma.loanPayment.create({
        data: {
            loanId,
            paymentDate,
            paymentNumber: paymentCount + 1,
            principalPart: Math.round(principalPart * 100) / 100,
            interestPart: Math.round(interestPart * 100) / 100,
            totalPayment: Math.round(totalPayment * 100) / 100,
            balanceAfter: Math.round(newBalance * 100) / 100,
            journalEntryId,
            notes,
        },
    });

    // Update loan totals
    await prisma.loan.update({
        where: { id: loanId },
        data: {
            totalPaid: { increment: totalPayment },
            principalPaid: { increment: principalPart },
            interestPaid: { increment: interestPart },
            remainingBalance: newBalance,
            isActive: newBalance > 0,
        },
    });

    // Mark schedule entry as paid if applicable
    if (loan.schedule.length > 0) {
        await prisma.loanSchedule.update({
            where: { id: loan.schedule[0].id },
            data: { isPaid: true },
        });
    }

    return payment;
}

/**
 * Get all loans for a company
 */
export async function getLoans(companyId: string) {
    return prisma.loan.findMany({
        where: { companyId },
        include: {
            schedule: { orderBy: { periodNumber: "asc" } },
            payments: { orderBy: { paymentDate: "desc" }, take: 5 },
        },
        orderBy: { createdAt: "desc" },
    });
}

/**
 * Get upcoming loan payments
 */
export async function getUpcomingPayments(companyId: string, daysAhead: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return prisma.loanSchedule.findMany({
        where: {
            isPaid: false,
            dueDate: { lte: futureDate },
            loan: {
                companyId,
                isActive: true,
            },
        },
        include: { loan: true },
        orderBy: { dueDate: "asc" },
    });
}

/**
 * Calculate interest accrual for a period
 * Use this for month-end accruals
 */
export async function calculateInterestAccrual(
    companyId: string,
    asOfDate: Date
) {
    const activeLoans = await prisma.loan.findMany({
        where: { companyId, isActive: true },
    });

    let totalAccrual = 0;
    const details = [];

    for (const loan of activeLoans) {
        // Calculate monthly interest based on remaining balance
        const monthlyInterest = loan.remainingBalance * (loan.interestRate / 12);
        totalAccrual += monthlyInterest;

        details.push({
            loanId: loan.id,
            loanName: loan.loanName,
            lenderName: loan.lenderName,
            balance: loan.remainingBalance,
            monthlyInterest: Math.round(monthlyInterest * 100) / 100,
        });
    }

    return {
        asOfDate,
        totalAccrual: Math.round(totalAccrual * 100) / 100,
        details,
    };
}

export default {
    createLoan,
    getLoanWithSchedule,
    recordLoanPayment,
    getLoans,
    getUpcomingPayments,
    calculateInterestAccrual,
    calculateMonthlyPayment,
    calculateTotalInterest,
    generateAmortizationSchedule,
};
