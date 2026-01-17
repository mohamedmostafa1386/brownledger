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

        const products = await prisma.product.findMany({
            where: { companyId, isActive: true },
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                sku: true,
                stockQuantity: true,
                lowStockAlert: true,
                costPrice: true,
                sellingPrice: true,
            },
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error("Current stock error:", error);
        return NextResponse.json(
            { error: "Failed to fetch current stock" },
            { status: 500 }
        );
    }
}
