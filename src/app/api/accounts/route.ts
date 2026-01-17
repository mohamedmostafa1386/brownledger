import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { seedDefaultChartOfAccounts } from "@/lib/gl/auto-post";
import { requireCompanyId } from "@/lib/api-auth";
import { permissions } from "@/lib/rbac";

// Get all accounts
export async function GET(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canViewFinancials(role)) {
            return NextResponse.json({ error: "Forbidden: You do not have permission to view accounts" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type"); // ASSET, LIABILITY, etc.

        const where: any = { companyId };
        if (type) where.accountType = type;

        const accounts = await prisma.account.findMany({
            where,
            include: {
                parent: { select: { accountCode: true, accountName: true } },
                children: { select: { id: true, accountCode: true, accountName: true } },
            },
            orderBy: { accountCode: "asc" },
        });

        return NextResponse.json(accounts);
    } catch (error) {
        console.error("Error fetching accounts:", error);
        return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
    }
}

// Create new account
export async function POST(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canManageAccounts(role)) {
            return NextResponse.json({ error: "Forbidden: Only authorized roles can manage the chart of accounts" }, { status: 403 });
        }

        const body = await request.json();
        const {
            accountCode,
            accountName,
            accountNameAr,
            accountType,
            accountCategory,
            parentId,
            normalBalance,
            seedDefaults, // Special flag to seed default COA
        } = body;

        // Seed defaults if requested
        if (seedDefaults) {
            const count = await seedDefaultChartOfAccounts(companyId);
            return NextResponse.json({ success: true, message: `Seeded ${count} default accounts` });
        }

        // Create single account
        const account = await prisma.account.create({
            data: {
                companyId,
                accountCode,
                accountName,
                accountNameAr,
                accountType,
                accountCategory,
                parentId,
                normalBalance,
            },
        });

        return NextResponse.json(account);
    } catch (error: any) {
        console.error("Error creating account:", error);
        if (error.code === "P2002") {
            return NextResponse.json({ error: "Account code already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
    }
}

// Update account
export async function PUT(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canManageAccounts(role)) {
            return NextResponse.json({ error: "Forbidden: Only authorized roles can manage the chart of accounts" }, { status: 403 });
        }

        const body = await request.json();
        const { id, ...data } = body;

        // Verify ownership
        const existing = await prisma.account.findFirst({
            where: { id, companyId },
        });
        if (!existing) {
            return NextResponse.json({ error: "Account not found or access denied" }, { status: 404 });
        }

        const account = await prisma.account.update({
            where: { id },
            data,
        });

        return NextResponse.json(account);
    } catch (error) {
        console.error("Error updating account:", error);
        return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
    }
}

// Delete account
export async function DELETE(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canManageAccounts(role)) {
            return NextResponse.json({ error: "Forbidden: Only authorized roles can manage the chart of accounts" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Account ID required" }, { status: 400 });
        }

        // Verify ownership
        const existing = await prisma.account.findFirst({
            where: { id, companyId },
        });
        if (!existing) {
            return NextResponse.json({ error: "Account not found or access denied" }, { status: 404 });
        }

        // Check if account has journal lines
        const lineCount = await prisma.journalEntryLine.count({ where: { accountId: id } });
        if (lineCount > 0) {
            return NextResponse.json({ error: "Cannot delete account with journal entries" }, { status: 400 });
        }

        await prisma.account.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting account:", error);
        return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }
}
