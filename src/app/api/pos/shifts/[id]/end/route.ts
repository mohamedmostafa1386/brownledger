import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";

// POST /api/pos/shifts/[id]/end - End a shift
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const { id } = await params;
        const body = await request.json();

        const shift = await prisma.cashierShift.findFirst({
            where: { id, companyId, endTime: null },
        });

        if (!shift) {
            return NextResponse.json({ error: "Shift not found or already ended" }, { status: 404 });
        }

        // Calculate total sales during shift
        const sales = await prisma.pOSSale.aggregate({
            where: {
                companyId,
                saleDate: { gte: shift.startTime },
                status: "COMPLETED",
            },
            _sum: { total: true },
        });

        const cashSales = await prisma.pOSSale.aggregate({
            where: {
                companyId,
                saleDate: { gte: shift.startTime },
                paymentMethod: "CASH",
                status: "COMPLETED",
            },
            _sum: { total: true },
        });

        const refunds = await prisma.pOSSale.aggregate({
            where: {
                companyId,
                saleDate: { gte: shift.startTime },
                status: { in: ["REFUNDED", "PARTIALLY_REFUNDED"] },
            },
            _sum: { total: true },
        });

        const totalSales = sales._sum.total || 0;
        const totalRefunds = refunds._sum.total || 0;
        const expectedCash = shift.openingCash + (cashSales._sum.total || 0);
        const closingCash = body.closingCash || 0;
        const cashDifference = closingCash - expectedCash;

        const updatedShift = await prisma.cashierShift.update({
            where: { id },
            data: {
                endTime: new Date(),
                closingCash,
                expectedCash,
                cashDifference,
                totalSales,
                totalRefunds,
                notes: body.notes,
            },
            include: { cashier: { select: { name: true } } },
        });

        return NextResponse.json(updatedShift);
    } catch (error) {
        console.error("End shift error:", error);
        return NextResponse.json({ error: "Failed to end shift" }, { status: 500 });
    }
}
