import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";
import { permissions } from "@/lib/rbac";

// IFRS-Compliant Statement of Financial Position (Balance Sheet)
// Per IAS 1 - With backward compatibility for frontend
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canViewFinancials(role)) {
            return NextResponse.json({ error: "Forbidden: Only accountants can view financials" }, { status: 403 });
        }
        const asOf = searchParams.get("asOf");
        const asOfDate = asOf ? new Date(asOf) : new Date();

        // Get all active accounts
        const accounts = await prisma.account.findMany({
            where: { companyId, isActive: true },
            orderBy: { accountCode: "asc" },
        });

        // Build backward-compatible format for frontend
        const assetItems: { account: string; code: string; balance: number; category: string }[] = [];
        const liabilityItems: { account: string; code: string; balance: number; category: string }[] = [];
        const equityItems: { account: string; code: string; balance: number; category: string }[] = [];

        let totalAssets = 0;
        let totalLiabilities = 0;
        let totalEquity = 0;
        let currentAssets = 0;
        let fixedAssets = 0;
        let currentLiabilities = 0;
        let longTermLiabilities = 0;

        for (const account of accounts) {
            const item = {
                account: account.accountName,
                code: account.accountCode,
                balance: account.currentBalance,
                category: account.accountCategory,
            };

            switch (account.accountType) {
                case "ASSET":
                    assetItems.push(item);
                    totalAssets += account.currentBalance;
                    if (account.accountCategory === "CURRENT_ASSET") {
                        currentAssets += account.currentBalance;
                    } else {
                        fixedAssets += account.currentBalance;
                    }
                    break;
                case "LIABILITY":
                    liabilityItems.push(item);
                    totalLiabilities += account.currentBalance;
                    if (account.accountCategory === "CURRENT_LIABILITY") {
                        currentLiabilities += account.currentBalance;
                    } else {
                        longTermLiabilities += account.currentBalance;
                    }
                    break;
                case "EQUITY":
                    equityItems.push(item);
                    totalEquity += account.currentBalance;
                    break;
            }
        }

        // Calculate retained earnings from P&L
        const revenueAccounts = accounts.filter(a => a.accountType === "REVENUE");
        const expenseAccounts = accounts.filter(a => a.accountType === "EXPENSE");
        const retainedEarnings =
            revenueAccounts.reduce((sum, a) => sum + a.currentBalance, 0) -
            expenseAccounts.reduce((sum, a) => sum + a.currentBalance, 0);

        // Balance check
        const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity + retainedEarnings)) < 0.01;

        return NextResponse.json({
            // IFRS Metadata
            title: "Statement of Financial Position",
            standard: "IFRS / IAS 1",
            asOfDate: asOfDate.toISOString(),

            // Backward-compatible format for frontend
            assets: {
                items: assetItems,
                currentAssets,
                fixedAssets,
                total: totalAssets,
            },
            liabilities: {
                items: liabilityItems,
                currentLiabilities,
                longTermLiabilities,
                total: totalLiabilities,
            },
            equity: {
                items: equityItems,
                retainedEarnings,
                total: totalEquity + retainedEarnings,
            },
            totalLiabilitiesAndEquity: totalLiabilities + totalEquity + retainedEarnings,
            isBalanced,
        });
    } catch (error) {
        console.error("Error generating balance sheet:", error);
        return NextResponse.json({ error: "Failed to generate balance sheet" }, { status: 500 });
    }
}
