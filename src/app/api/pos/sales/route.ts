import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// GET /api/pos/sales - Fetch sales history
export async function GET(request: Request) {
    try {
        const auth = await requireAuth();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const { searchParams } = new URL(request.url);
        const from = searchParams.get("from");
        const to = searchParams.get("to");

        const sales = await prisma.pOSSale.findMany({
            where: {
                companyId,
                saleDate: {
                    gte: from ? new Date(from) : undefined,
                    lte: to ? new Date(to) : undefined,
                },
            },
            include: {
                items: true,
                cashier: { select: { name: true } },
            },
            orderBy: { saleDate: "desc" },
            take: 100,
        });

        return NextResponse.json(sales);
    } catch (error) {
        console.error("POS Sales API error:", error);
        return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
    }
}

// POST /api/pos/sales - Create new sale
export async function POST(request: Request) {
    try {
        const auth = await requireAuth();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, userId: cashierId } = auth;

        const body = await request.json();

        // Generate sale number
        const lastSale = await prisma.pOSSale.findFirst({
            where: { companyId },
            orderBy: { saleNumber: "desc" },
        });
        const nextNumber = lastSale
            ? `SALE-${String(parseInt(lastSale.saleNumber.split("-")[1] || "0") + 1).padStart(5, "0")}`
            : "SALE-00001";

        // Create sale with items
        const sale = await prisma.pOSSale.create({
            data: {
                companyId,
                cashierId,
                saleNumber: nextNumber,
                subtotal: body.subtotal,
                taxAmount: body.taxAmount,
                discountAmount: body.discountAmount || 0,
                total: body.total,
                paymentMethod: body.paymentMethod,
                cashReceived: body.cashReceived,
                changeGiven: body.changeGiven,
                customerName: body.customerName,
                customerPhone: body.customerPhone,
                notes: body.notes,
                items: {
                    create: body.items.map((item: {
                        productId: string;
                        productName: string;
                        quantity: number;
                        unitPrice: number;
                        taxRate: number;
                        discount?: number;
                        total: number;
                    }) => ({
                        productId: item.productId,
                        productName: item.productName,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        taxRate: item.taxRate,
                        discount: item.discount || 0,
                        total: item.total,
                    })),
                },
            },
            include: { items: true, cashier: { select: { name: true } } },
        });

        // Update inventory for each item
        for (const item of body.items) {
            await prisma.product.update({
                where: { id: item.productId },
                data: {
                    stockQuantity: { decrement: item.quantity },
                },
            });

            // Create stock movement record
            await prisma.stockMovement.create({
                data: {
                    companyId,
                    productId: item.productId,
                    type: "SALE",
                    quantity: -item.quantity,
                    reference: nextNumber,
                },
            });
        }

        // Update customer loyalty points if phone provided
        if (body.customerPhone) {
            const client = await prisma.client.findFirst({
                where: { companyId, phone: body.customerPhone },
            });

            if (client) {
                await prisma.client.update({
                    where: { id: client.id },
                    data: { loyaltyPoints: { increment: Math.floor(body.total) } },
                });
            }
        }

        return NextResponse.json(sale, { status: 201 });
    } catch (error) {
        console.error("Create sale error:", error);
        return NextResponse.json({ error: "Failed to create sale" }, { status: 500 });
    }
}
