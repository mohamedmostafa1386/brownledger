import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireCompanyId } from "@/lib/api-auth";

export async function GET() {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const alerts = await prisma.stockAlert.findMany({
            where: { companyId, isResolved: false },
            orderBy: { createdAt: "desc" },
            include: {
                product: {
                    select: { name: true, sku: true },
                },
            },
        });

        return NextResponse.json(alerts);
    } catch (error) {
        console.error("Stock alerts error:", error);
        return NextResponse.json(
            { error: "Failed to fetch stock alerts" },
            { status: 500 }
        );
    }
}
