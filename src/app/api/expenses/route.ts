import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";
import { permissions } from "@/lib/rbac";

// GET /api/expenses - Fetch all expenses
export async function GET() {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canViewFinancials(role)) {
            return NextResponse.json({ error: "Forbidden: Only accountants can view expenses" }, { status: 403 });
        }

        const expenses = await prisma.expense.findMany({
            where: { companyId },
            include: { category: true },
            orderBy: { date: "desc" },
        });

        const formatted = expenses.map((exp) => ({
            id: exp.id,
            date: exp.date,
            vendor: exp.vendor || "Unknown",
            description: exp.description,
            category: exp.category?.name || "Uncategorized",
            amount: exp.amount,
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Expenses API error:", error);
        return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
    }
}

// POST /api/expenses - Create new expense
export async function POST(request: Request) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canPostJournals(role)) {
            return NextResponse.json({ error: "Forbidden: Only accountants can record expenses" }, { status: 403 });
        }

        const body = await request.json();

        const expense = await prisma.expense.create({
            data: {
                companyId,
                categoryId: body.categoryId || null,
                date: new Date(body.date),
                amount: body.amount,
                vendor: body.vendor,
                description: body.description,
                notes: body.notes,
            },
        });

        return NextResponse.json(expense, { status: 201 });
    } catch (error) {
        console.error("Create expense error:", error);
        return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
    }
}
