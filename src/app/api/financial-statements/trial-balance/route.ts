import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";
import { permissions } from "@/lib/rbac";

// Get trial balance
export async function GET(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canViewFinancials(role)) {
            return NextResponse.json({ error: "Forbidden: Only accountants can view financials" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("start");
        const endDate = searchParams.get("end");

        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
        const end = endDate ? new Date(endDate) : new Date();

        // Get all accounts
        const accounts = await prisma.account.findMany({
            where: { companyId, isActive: true },
            orderBy: { accountCode: "asc" },
        });

        // Get all journal lines for the period
        const journalLines = await prisma.journalEntryLine.findMany({
            where: {
                journalEntry: {
                    companyId,
                    status: "POSTED",
                    entryDate: { gte: start, lte: end },
                },
            },
            include: {
                account: true,
            },
        });

        // Calculate debit and credit totals per account
        const accountTotals = new Map<string, { debit: number; credit: number }>();

        for (const line of journalLines) {
            const existing = accountTotals.get(line.accountId) || { debit: 0, credit: 0 };
            existing.debit += line.debit;
            existing.credit += line.credit;
            accountTotals.set(line.accountId, existing);
        }

        // Build trial balance
        const items = accounts.map((account) => {
            const totals = accountTotals.get(account.id) || { debit: 0, credit: 0 };
            const balance = totals.debit - totals.credit;

            return {
                accountCode: account.accountCode,
                accountName: account.accountName,
                accountNameAr: account.accountNameAr,
                accountType: account.accountType,
                debit: totals.debit,
                credit: totals.credit,
                balance,
                displayDebit: account.normalBalance === "DEBIT" ? Math.abs(balance) : (balance < 0 ? Math.abs(balance) : 0),
                displayCredit: account.normalBalance === "CREDIT" ? Math.abs(balance) : (balance > 0 ? Math.abs(balance) : 0),
            };
        }).filter(item => item.debit > 0 || item.credit > 0);

        const totalDebit = items.reduce((sum, item) => sum + item.displayDebit, 0);
        const totalCredit = items.reduce((sum, item) => sum + item.displayCredit, 0);
        const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

        return NextResponse.json({
            periodStart: start.toISOString(),
            periodEnd: end.toISOString(),
            items,
            totalDebit,
            totalCredit,
            isBalanced,
        });
    } catch (error) {
        console.error("Error generating trial balance:", error);
        return NextResponse.json({ error: "Failed to generate trial balance" }, { status: 500 });
    }
}
