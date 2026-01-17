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

        // Get all products with stock info
        const products = await prisma.product.findMany({
            where: { companyId },
            select: {
                id: true,
                stockQuantity: true,
                lowStockAlert: true,
                costPrice: true,
            },
        });

        // Calculate stats
        const totalItems = products.length;
        const totalValue = products.reduce(
            (sum, p) => sum + p.stockQuantity * p.costPrice,
            0
        );
        const lowStock = products.filter(
            (p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockAlert
        ).length;
        const outOfStock = products.filter((p) => p.stockQuantity === 0).length;

        return NextResponse.json({
            totalItems,
            totalValue,
            lowStock,
            outOfStock,
            warehouses: 1, // Default warehouse
        });
    } catch (error) {
        console.error("Stock stats error:", error);
        return NextResponse.json(
            { error: "Failed to fetch stock stats" },
            { status: 500 }
        );
    }
}
