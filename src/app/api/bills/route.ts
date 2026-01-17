import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";
import { permissions } from "@/lib/rbac";

// GET /api/bills - Fetch all bills
export async function GET(request: Request) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canViewFinancials(role)) {
            return NextResponse.json({ error: "Forbidden: Only accountants can view bills" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const supplierId = searchParams.get("supplierId");

        const bills = await prisma.bill.findMany({
            where: {
                companyId,
                status: status || undefined,
                supplierId: supplierId || undefined,
            },
            include: {
                supplier: { select: { id: true, name: true } },
                items: true,
            },
            orderBy: { dueDate: "asc" },
        });

        const formatted = bills.map((bill) => {
            const subtotal = bill.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
            const tax = subtotal * bill.taxRate;
            const total = subtotal + tax;
            return {
                ...bill,
                subtotal,
                tax,
                total,
            };
        });

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Bills API error:", error);
        return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
    }
}

// POST /api/bills - Create new bill
export async function POST(request: Request) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canPostJournals(role)) {
            return NextResponse.json({ error: "Forbidden: Only accountants can record bills" }, { status: 403 });
        }

        const body = await request.json();

        // Generate bill number
        const lastBill = await prisma.bill.findFirst({
            where: { companyId },
            orderBy: { billNumber: "desc" },
        });
        const nextNumber = lastBill
            ? `BILL-${String(parseInt(lastBill.billNumber.split("-")[1] || "0") + 1).padStart(3, "0")}`
            : "BILL-001";

        // Use transaction to ensure bill creation and stock updates happen atomically
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the Bill
            const bill = await tx.bill.create({
                data: {
                    companyId,
                    supplierId: body.supplierId,
                    billNumber: nextNumber,
                    issueDate: new Date(body.issueDate),
                    dueDate: new Date(body.dueDate),
                    status: body.status || "DRAFT",
                    taxRate: body.taxRate || 0,
                    notes: body.notes,
                    items: {
                        create: body.items.map((item: { productId?: string; description: string; quantity: number; unitPrice: number }) => ({
                            productId: item.productId, // Link to product
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                        })),
                    },
                },
                include: { items: true, supplier: true },
            });

            // 2. Update Stock Levels (Fulfill Item Cards)
            for (const item of body.items) {
                if (item.productId) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stockQuantity: { increment: item.quantity },
                            costPrice: item.unitPrice, // Update last cost price
                        },
                    });
                }
            }

            return bill;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Create bill error:", error);
        return NextResponse.json({ error: "Failed to create bill" }, { status: 500 });
    }
}
