import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";
import {
    createPrepaidExpense,
    getPrepaidExpenses,
    getPendingAmortizations,
    processAllPendingAmortizations,
    getAmortizationSchedule,
} from "@/lib/accounting/expense-amortization";

// GET /api/prepaid-expenses - List all prepaid expenses
export async function GET(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (id) {
            // Verify access to this specific prepaid expense
            const prepaid = await prisma.prepaidExpense.findFirst({
                where: { id, companyId },
            });
            if (!prepaid) {
                return NextResponse.json({ error: "Prepaid expense not found or access denied" }, { status: 404 });
            }

            // Get schedule for specific prepaid expense
            const schedule = await getAmortizationSchedule(id);
            return NextResponse.json({ schedule });
        }

        const prepaidExpenses = await getPrepaidExpenses(companyId);

        // Also get pending amortizations
        const pending = await getPendingAmortizations(companyId);

        return NextResponse.json({
            prepaidExpenses,
            pendingCount: pending.length,
            pendingTotal: pending.reduce((sum, p) => sum + p.amount, 0),
        });
    } catch (error) {
        console.error("Error fetching prepaid expenses:", error);
        return NextResponse.json({ error: "Failed to fetch prepaid expenses" }, { status: 500 });
    }
}

// POST /api/prepaid-expenses - Create new prepaid expense
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

        // Process all pending amortizations
        if (action === "process-pending") {
            const results = await processAllPendingAmortizations(companyId);
            return NextResponse.json({
                processed: results.length,
                totalAmount: results.reduce((sum, r) => sum + r.amount, 0),
                details: results,
            });
        }

        // Create new prepaid expense
        const prepaidExpense = await createPrepaidExpense({
            companyId,
            description: body.description,
            vendorName: body.vendorName,
            referenceNumber: body.referenceNumber,
            totalAmount: body.totalAmount,
            startDate: new Date(body.startDate),
            endDate: new Date(body.endDate),
            expenseAccountId: body.expenseAccountId,
            assetAccountId: body.assetAccountId,
            notes: body.notes,
        });

        return NextResponse.json(prepaidExpense, { status: 201 });
    } catch (error) {
        console.error("Error creating prepaid expense:", error);
        return NextResponse.json({ error: "Failed to create prepaid expense" }, { status: 500 });
    }
}
