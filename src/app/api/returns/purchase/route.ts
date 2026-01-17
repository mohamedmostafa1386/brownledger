import { NextRequest, NextResponse } from "next/server";
import { requireCompanyId } from "@/lib/api-auth";
import { createPurchaseReturn } from "@/lib/accounting/returns";
import { prisma } from "@/lib/prisma";

// GET /api/returns/purchase - List company purchase returns
export async function GET(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const returns = await prisma.purchaseReturn.findMany({
            where: { companyId },
            include: {
                supplier: { select: { name: true } },
                bill: { select: { billNumber: true } },
                items: true,
            },
            orderBy: { returnDate: "desc" },
        });

        return NextResponse.json(returns);
    } catch (error: any) {
        console.error("Purchase return GET error:", error);
        return NextResponse.json({ error: "Failed to fetch purchase returns" }, { status: 500 });
    }
}

// POST /api/returns/purchase - Create a new purchase return
export async function POST(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const body = await request.json();

        const result = await createPurchaseReturn({
            ...body,
            companyId,
            returnDate: new Date(body.returnDate || new Date()),
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error("Purchase return POST error:", error);
        return NextResponse.json({ error: error.message || "Failed to create purchase return" }, { status: 500 });
    }
}
