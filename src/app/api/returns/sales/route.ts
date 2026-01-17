import { NextRequest, NextResponse } from "next/server";
import { requireCompanyId } from "@/lib/api-auth";
import { createSalesReturn } from "@/lib/accounting/returns";
import { prisma } from "@/lib/prisma";

// GET /api/returns/sales - List company sales returns
export async function GET(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const returns = await prisma.salesReturn.findMany({
            where: { companyId },
            include: {
                client: { select: { name: true } },
                invoice: { select: { invoiceNumber: true } },
                posSale: { select: { saleNumber: true } },
                items: true,
            },
            orderBy: { returnDate: "desc" },
        });

        return NextResponse.json(returns);
    } catch (error: any) {
        console.error("Sales return GET error:", error);
        return NextResponse.json({ error: "Failed to fetch sales returns" }, { status: 500 });
    }
}

// POST /api/returns/sales - Create a new sales return
export async function POST(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const body = await request.json();

        const result = await createSalesReturn({
            ...body,
            companyId,
            returnDate: new Date(body.returnDate || new Date()),
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("Sales return POST error:", error);
        return NextResponse.json({ error: error.message || "Failed to create sales return" }, { status: 500 });
    }
}
