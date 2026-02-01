
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";

export async function GET() {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const warehouses = await prisma.warehouse.findMany({
            where: { companyId },
            include: {
                _count: {
                    select: { stocks: true }
                }
            }
        });

        // Add calculated fields to match frontend expectation (itemCount, totalValue)
        // Note: For now we return basic info. Complex aggregation might be needed for totalValue.
        // But since we are just enabling the feature, let's keep it simple or do a quick aggregation if possible.

        // Improve: fetch stocks to calc value?
        // Let's just return the warehouses for now, frontend might need adjustment to handle missing 'totalValue' or we mock it.
        const formatted = warehouses.map(w => ({
            id: w.id,
            name: w.name,
            code: w.code,
            location: w.location,
            itemCount: w._count.stocks,
            totalValue: 0 // Placeholder as computing this requires joining Stock -> Product -> Cost
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Warehouses fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch warehouses" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const body = await request.json();
        const { name, code, location } = body;

        if (!name || !code) {
            return NextResponse.json({ error: "Name and Code are required" }, { status: 400 });
        }

        const warehouse = await prisma.warehouse.create({
            data: {
                companyId,
                name,
                code,
                location
            }
        });

        return NextResponse.json(warehouse, { status: 201 });
    } catch (error) {
        console.error("Warehouse create error:", error);
        return NextResponse.json({ error: "Failed to create warehouse" }, { status: 500 });
    }
}
