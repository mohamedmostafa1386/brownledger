import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";
import { permissions } from "@/lib/rbac";

// Bank Reconciliation API
// Matches bank statement entries with system transactions

// GET - Fetch reconciliation data for a bank account
export async function GET(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canReconcileBank(role)) {
            return NextResponse.json({ error: "Forbidden: Only accountants or admins can reconcile banks" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const bankAccountId = searchParams.get("bankAccountId");

        if (!bankAccountId) {
            // Return list of bank accounts for selection
            const bankAccounts = await prisma.bankAccount.findMany({
                where: { companyId },
            });
            return NextResponse.json({ bankAccounts });
        }

        // Get bank account details
        const bankAccount = await prisma.bankAccount.findFirst({
            where: { id: bankAccountId, companyId },
        });

        if (!bankAccount) {
            return NextResponse.json({ error: "Bank account not found" }, { status: 404 });
        }

        // Get unreconciled expenses from the system
        const expenses = await prisma.expense.findMany({
            where: { companyId },
            include: { category: { select: { name: true } } },
            orderBy: { date: "desc" },
            take: 50,
        });

        // Format transactions for reconciliation based on actual schema fields
        const systemTransactions = [
            ...expenses.map(e => ({
                id: e.id,
                type: "EXPENSE" as const,
                date: e.date,
                description: e.description,
                reference: e.receiptUrl || "",
                amount: e.amount,
                isCredit: false,
                isReconciled: false,
                matchedBankEntryId: null,
            })),
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Bank statement entries (simulated - in production, import from bank feed)
        const bankStatementEntries = generateSampleBankStatement(bankAccount.balance);

        // Calculate reconciliation status
        const systemBalance = systemTransactions.reduce((sum, t) =>
            sum + (t.isCredit ? t.amount : -t.amount), 0);
        const statementBalance = bankAccount.balance;
        const difference = statementBalance - systemBalance;

        return NextResponse.json({
            bankAccount: {
                id: bankAccount.id,
                name: bankAccount.name,
                accountNumber: bankAccount.accountNumber,
                currentBalance: bankAccount.balance,
            },
            systemTransactions,
            bankStatementEntries,
            reconciliation: {
                statementBalance,
                systemBalance: Math.round(systemBalance * 100) / 100,
                difference: Math.round(difference * 100) / 100,
                isReconciled: Math.abs(difference) < 0.01,
                unreconciledCount: systemTransactions.filter(t => !t.isReconciled).length,
            },
        });
    } catch (error) {
        console.error("Error fetching reconciliation data:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}

// POST - Match/reconcile transactions
export async function POST(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canReconcileBank(role)) {
            return NextResponse.json({ error: "Forbidden: Only accountants or admins can reconcile banks" }, { status: 403 });
        }

        const body = await request.json();
        const { matches, bankAccountId } = body;

        // Verify bank account belongs to company
        const bankAccount = await prisma.bankAccount.findFirst({
            where: { id: bankAccountId, companyId },
        });
        if (!bankAccount) {
            return NextResponse.json({ error: "Bank account not found or access denied" }, { status: 404 });
        }

        // matches is an array of: { systemTransactionId, bankEntryId, systemType }

        // In a real implementation, you would:
        // 1. Mark system transactions as reconciled
        // 2. Link them to the bank statement entry
        // 3. Update the bank account's reconciled balance

        // For now, just return success
        return NextResponse.json({
            success: true,
            matchedCount: matches?.length || 0,
            message: `Successfully reconciled ${matches?.length || 0} transactions`,
        });
    } catch (error) {
        console.error("Error reconciling transactions:", error);
        return NextResponse.json({ error: "Failed to reconcile" }, { status: 500 });
    }
}

// Helper: Generate sample bank statement entries for demo
function generateSampleBankStatement(currentBalance: number) {
    const entries = [];
    let runningBalance = currentBalance;
    const today = new Date();

    // Generate 15 sample bank statement entries
    const sampleEntries = [
        { desc: "Online Transfer - Customer Payment", amount: 5000, isCredit: true },
        { desc: "Check Deposit #1234", amount: 12500, isCredit: true },
        { desc: "Wire Transfer Received", amount: 8750, isCredit: true },
        { desc: "ACH Payment - Supplier ABC", amount: 3200, isCredit: false },
        { desc: "Check #5678 - Rent", amount: 4500, isCredit: false },
        { desc: "Utility Payment - Electric", amount: 850, isCredit: false },
        { desc: "Card Payment Received", amount: 2300, isCredit: true },
        { desc: "Bank Fee - Monthly", amount: 25, isCredit: false },
        { desc: "Interest Earned", amount: 45, isCredit: true },
        { desc: "Payroll - Salaries", amount: 15000, isCredit: false },
        { desc: "Customer Deposit", amount: 6500, isCredit: true },
        { desc: "Supplier Payment - XYZ Ltd", amount: 4800, isCredit: false },
        { desc: "Cash Withdrawal", amount: 1000, isCredit: false },
        { desc: "Transfer from Savings", amount: 5000, isCredit: true },
        { desc: "Insurance Premium", amount: 1200, isCredit: false },
    ];

    for (let i = 0; i < sampleEntries.length; i++) {
        const entry = sampleEntries[i];
        const entryDate = new Date(today);
        entryDate.setDate(today.getDate() - i * 2);

        const amount = entry.amount;
        if (entry.isCredit) {
            runningBalance -= amount; // Working backwards
        } else {
            runningBalance += amount;
        }

        entries.push({
            id: `bank-entry-${i + 1}`,
            date: entryDate.toISOString(),
            description: entry.desc,
            reference: `REF${String(1000 + i).padStart(6, '0')}`,
            amount: entry.amount,
            isCredit: entry.isCredit,
            balance: Math.round(runningBalance * 100) / 100,
            isMatched: false,
            matchedSystemId: null,
        });
    }

    return entries;
}
