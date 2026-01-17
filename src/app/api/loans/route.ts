import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";
import {
    createLoan,
    getLoans,
    getLoanWithSchedule,
    recordLoanPayment,
    getUpcomingPayments,
    calculateInterestAccrual,
} from "@/lib/accounting/loan-accounting";

// GET /api/loans - List all loans or get specific loan details
export async function GET(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const action = searchParams.get("action");

        // Get specific loan with schedule
        if (id) {
            // Verify access to this specific loan
            const existing = await prisma.loan.findFirst({
                where: { id, companyId },
            });
            if (!existing) {
                return NextResponse.json({ error: "Loan not found or access denied" }, { status: 404 });
            }

            const loan = await getLoanWithSchedule(id);
            return NextResponse.json(loan);
        }

        // Get upcoming payments
        if (action === "upcoming") {
            const days = parseInt(searchParams.get("days") || "30");
            const upcoming = await getUpcomingPayments(companyId, days);
            return NextResponse.json({ upcoming });
        }

        // Get interest accrual
        if (action === "accrual") {
            const accrual = await calculateInterestAccrual(companyId, new Date());
            return NextResponse.json(accrual);
        }

        // List all loans
        const loans = await getLoans(companyId);

        // Calculate summary
        const totalPrincipal = loans.reduce((sum, l) => sum + l.principalAmount, 0);
        const totalRemaining = loans.reduce((sum, l) => sum + l.remainingBalance, 0);
        const totalInterestPaid = loans.reduce((sum, l) => sum + l.interestPaid, 0);
        const activeLoans = loans.filter(l => l.isActive).length;

        return NextResponse.json({
            loans,
            summary: {
                totalLoans: loans.length,
                activeLoans,
                totalPrincipal,
                totalRemaining,
                totalInterestPaid,
            },
        });
    } catch (error) {
        console.error("Error fetching loans:", error);
        return NextResponse.json({ error: "Failed to fetch loans" }, { status: 500 });
    }
}

// POST /api/loans - Create new loan or record payment
export async function POST(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const body = await request.json();
        const { searchParams } = new URL(request.url);
        const action = searchParams.get("action");

        // Record a payment
        if (action === "payment") {
            // Verify access to the loan
            const existing = await prisma.loan.findFirst({
                where: { id: body.loanId, companyId },
            });
            if (!existing) {
                return NextResponse.json({ error: "Loan not found or access denied" }, { status: 404 });
            }

            const payment = await recordLoanPayment(
                body.loanId,
                new Date(body.paymentDate),
                body.amount,
                body.journalEntryId,
                body.notes
            );
            return NextResponse.json(payment, { status: 201 });
        }

        // Create new loan
        const loan = await createLoan({
            companyId,
            loanName: body.loanName,
            lenderName: body.lenderName,
            referenceNumber: body.referenceNumber,
            principalAmount: body.principalAmount,
            interestRate: body.interestRate,
            interestType: body.interestType,
            startDate: new Date(body.startDate),
            termMonths: body.termMonths,
            paymentFrequency: body.paymentFrequency,
            loanAccountId: body.loanAccountId,
            interestAccountId: body.interestAccountId,
            notes: body.notes,
        });

        return NextResponse.json(loan, { status: 201 });
    } catch (error) {
        console.error("Error with loan operation:", error);
        return NextResponse.json({ error: "Loan operation failed" }, { status: 500 });
    }
}
