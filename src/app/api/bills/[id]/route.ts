import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const authInfo = await requireAuth();
    if ("error" in authInfo) {
        return NextResponse.json({ error: authInfo.error }, { status: authInfo.status });
    }

    const { id } = params;

    try {
        const bill = await prisma.bill.findUnique({
            where: {
                id,
                companyId: authInfo.companyId,
            },
            include: {
                items: true,
            },
        });

        if (!bill) {
            return NextResponse.json({ error: "Bill not found" }, { status: 404 });
        }

        return NextResponse.json(bill);
    } catch (error) {
        console.error("Error fetching bill:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
