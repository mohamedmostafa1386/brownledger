import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Get stock movements - query all since movements will be filtered by product
        const movements = await prisma.stockMovement.findMany({
            orderBy: { date: "desc" },
            take: 50,
            include: {
                product: {
                    select: { name: true, sku: true },
                },
            },
        });

        return NextResponse.json(movements);
    } catch (error) {
        console.error("Stock movements error:", error);
        return NextResponse.json(
            { error: "Failed to fetch stock movements" },
            { status: 500 }
        );
    }
}
