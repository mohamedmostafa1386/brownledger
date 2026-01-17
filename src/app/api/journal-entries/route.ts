import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";
import { permissions } from "@/lib/rbac";

// Get all journal entries
export async function GET(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canViewFinancials(role)) {
            return NextResponse.json({ error: "Forbidden: Only accountants can view journals" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const sourceType = searchParams.get("sourceType");
        const status = searchParams.get("status");
        const limit = parseInt(searchParams.get("limit") || "50");

        const where: any = { companyId };
        if (sourceType) where.sourceType = sourceType;
        if (status) where.status = status;

        const entries = await prisma.journalEntry.findMany({
            where,
            include: {
                lines: {
                    include: {
                        account: {
                            select: { accountCode: true, accountName: true },
                        },
                    },
                },
            },
            orderBy: { entryDate: "desc" },
            take: limit,
        });

        return NextResponse.json(entries);
    } catch (error) {
        console.error("Error fetching journal entries:", error);
        return NextResponse.json({ error: "Failed to fetch journal entries" }, { status: 500 });
    }
}

// Create manual journal entry
export async function POST(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canPostJournals(role)) {
            return NextResponse.json({ error: "Forbidden: Only accountants can post journals" }, { status: 403 });
        }

        const body = await request.json();
        const { entryDate, description, lines } = body;

        // Validate balance
        const totalDebit = lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
        const totalCredit = lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return NextResponse.json(
                { error: `Entry is not balanced. Debits: ${totalDebit}, Credits: ${totalCredit}` },
                { status: 400 }
            );
        }

        // Generate journal number
        const count = await prisma.journalEntry.count({ where: { companyId } });
        const journalNumber = `JE-${String(count + 1).padStart(6, "0")}`;

        const entry = await prisma.journalEntry.create({
            data: {
                companyId,
                journalNumber,
                entryDate: new Date(entryDate),
                description,
                sourceType: "MANUAL",
                status: "POSTED",
                totalDebit,
                totalCredit,
                lines: {
                    create: lines.map((line: any) => ({
                        accountId: line.accountId,
                        description: line.description,
                        debit: line.debit || 0,
                        credit: line.credit || 0,
                    })),
                },
            },
            include: { lines: true },
        });

        // Update account balances
        for (const line of lines) {
            const account = await prisma.account.findFirst({
                where: { id: line.accountId, companyId }
            });
            if (account) {
                const change = (line.debit || 0) - (line.credit || 0);
                const balanceChange = account.normalBalance === "DEBIT" ? change : -change;
                await prisma.account.update({
                    where: { id: line.accountId },
                    data: { currentBalance: { increment: balanceChange } },
                });
            }
        }

        return NextResponse.json(entry);
    } catch (error) {
        console.error("Error creating journal entry:", error);
        return NextResponse.json({ error: "Failed to create journal entry" }, { status: 500 });
    }
}

// Reverse journal entry
export async function PUT(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canPostJournals(role)) {
            return NextResponse.json({ error: "Forbidden: Only accountants can reverse journals" }, { status: 403 });
        }

        const body = await request.json();
        const { entryId } = body;

        const originalEntry = await prisma.journalEntry.findFirst({
            where: { id: entryId, companyId },
            include: { lines: true },
        });

        if (!originalEntry || originalEntry.status === "REVERSED") {
            return NextResponse.json({ error: "Entry not found or already reversed" }, { status: 400 });
        }

        // Generate reversal journal number
        const count = await prisma.journalEntry.count({ where: { companyId } });
        const journalNumber = `JE-${String(count + 1).padStart(6, "0")}`;

        // Create reversal entry (swap debits/credits)
        const reversalEntry = await prisma.journalEntry.create({
            data: {
                companyId,
                journalNumber,
                entryDate: new Date(),
                description: `Reversal of ${originalEntry.journalNumber}: ${originalEntry.description}`,
                sourceType: "MANUAL",
                status: "POSTED",
                totalDebit: originalEntry.totalCredit,
                totalCredit: originalEntry.totalDebit,
                lines: {
                    create: originalEntry.lines.map((line) => ({
                        accountId: line.accountId,
                        description: `Reversal: ${line.description || ""}`,
                        debit: line.credit,
                        credit: line.debit,
                    })),
                },
            },
            include: { lines: true },
        });

        // Mark original as reversed
        await prisma.journalEntry.update({
            where: { id: entryId },
            data: { status: "REVERSED" },
        });

        // Update account balances (reverse the original impact)
        for (const line of originalEntry.lines) {
            const account = await prisma.account.findFirst({
                where: { id: line.accountId, companyId }
            });
            if (account) {
                const change = (line.credit - line.debit);
                const balanceChange = account.normalBalance === "DEBIT" ? change : -change;
                await prisma.account.update({
                    where: { id: line.accountId },
                    data: { currentBalance: { increment: balanceChange } },
                });
            }
        }

        return NextResponse.json({ reversalEntry, originalUpdated: true });
    } catch (error) {
        console.error("Error reversing journal entry:", error);
        return NextResponse.json({ error: "Failed to reverse journal entry" }, { status: 500 });
    }
}
