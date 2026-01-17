import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// GET /api/pos/shifts - Get shifts
export async function GET(request: Request) {
    try {
        const auth = await requireAuth();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const { searchParams } = new URL(request.url);
        const current = searchParams.get("current") === "true";

        if (current) {
            // Get current active shift for any cashier
            const shift = await prisma.cashierShift.findFirst({
                where: { companyId, endTime: null },
                include: { cashier: { select: { name: true } } },
                orderBy: { startTime: "desc" },
            });
            return NextResponse.json(shift);
        }

        const shifts = await prisma.cashierShift.findMany({
            where: { companyId },
            include: { cashier: { select: { name: true } } },
            orderBy: { startTime: "desc" },
            take: 50,
        });

        return NextResponse.json(shifts);
    } catch (error) {
        console.error("Shifts API error:", error);
        return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 });
    }
}

// POST /api/pos/shifts - Start a new shift
export async function POST(request: Request) {
    try {
        const auth = await requireAuth();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, userId: cashierId } = auth;

        const body = await request.json();

        // Check if there's already an open shift
        const existingShift = await prisma.cashierShift.findFirst({
            where: { companyId, cashierId, endTime: null },
        });

        if (existingShift) {
            return NextResponse.json(
                { error: "You already have an active shift" },
                { status: 400 }
            );
        }

        const shift = await prisma.cashierShift.create({
            data: {
                companyId,
                cashierId,
                startTime: new Date(),
                openingCash: body.openingCash || 0,
            },
            include: { cashier: { select: { name: true } } },
        });

        return NextResponse.json(shift, { status: 201 });
    } catch (error) {
        console.error("Start shift error:", error);
        return NextResponse.json({ error: "Failed to start shift" }, { status: 500 });
    }
}
