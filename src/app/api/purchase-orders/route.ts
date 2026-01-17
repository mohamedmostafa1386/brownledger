import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";
import { permissions, canAccessModule } from "@/lib/rbac";

// GET /api/purchase-orders - Fetch all POs
export async function GET(request: Request) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!canAccessModule(role, "suppliers")) { // POs linked to suppliers module
            return NextResponse.json({ error: "Forbidden: Access to purchase orders is restricted" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const supplierId = searchParams.get("supplierId");

        const purchaseOrders = await prisma.purchaseOrder.findMany({
            where: {
                companyId,
                status: status || undefined,
                supplierId: supplierId || undefined,
            },
            include: {
                supplier: { select: { id: true, name: true } },
                items: true,
            },
            orderBy: { orderDate: "desc" },
        });

        const formatted = purchaseOrders.map((po) => {
            const total = po.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
            return { ...po, total };
        });

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("POs API error:", error);
        return NextResponse.json({ error: "Failed to fetch purchase orders" }, { status: 500 });
    }
}

// POST /api/purchase-orders - Create new PO
export async function POST(request: Request) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canManageInventory(role)) {
            return NextResponse.json({ error: "Forbidden: Only authorized roles can create purchase orders" }, { status: 403 });
        }

        const body = await request.json();

        // Generate PO number
        const lastPO = await prisma.purchaseOrder.findFirst({
            where: { companyId },
            orderBy: { poNumber: "desc" },
        });
        const nextNumber = lastPO
            ? `PO-${String(parseInt(lastPO.poNumber.split("-")[1] || "0") + 1).padStart(3, "0")}`
            : "PO-001";

        const po = await prisma.purchaseOrder.create({
            data: {
                companyId,
                supplierId: body.supplierId,
                poNumber: nextNumber,
                orderDate: new Date(body.orderDate),
                expectedDate: body.expectedDate ? new Date(body.expectedDate) : null,
                status: body.status || "DRAFT",
                notes: body.notes,
                items: {
                    create: body.items.map((item: { description: string; quantity: number; unitPrice: number }) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                    })),
                },
            },
            include: { items: true, supplier: true },
        });

        return NextResponse.json(po, { status: 201 });
    } catch (error) {
        console.error("Create PO error:", error);
        return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 });
    }
}
