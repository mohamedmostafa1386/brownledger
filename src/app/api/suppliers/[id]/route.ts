import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/suppliers/[id]
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: {
                contacts: true,
                bills: { include: { items: true }, orderBy: { issueDate: "desc" }, take: 10 },
                purchaseOrders: { orderBy: { orderDate: "desc" }, take: 10 },
                _count: { select: { bills: true, expenses: true, purchaseOrders: true } },
            },
        });

        if (!supplier) {
            return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
        }

        return NextResponse.json(supplier);
    } catch (error) {
        console.error("Get supplier error:", error);
        return NextResponse.json({ error: "Failed to fetch supplier" }, { status: 500 });
    }
}

// PUT /api/suppliers/[id]
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const supplier = await prisma.supplier.update({
            where: { id },
            data: {
                name: body.name,
                contactPerson: body.contactPerson,
                email: body.email,
                phone: body.phone,
                website: body.website,
                address: body.address,
                city: body.city,
                state: body.state,
                zipCode: body.zipCode,
                country: body.country,
                taxId: body.taxId,
                paymentTerms: body.paymentTerms,
                currency: body.currency,
                bankAccount: body.bankAccount,
                notes: body.notes,
                rating: body.rating,
                isActive: body.isActive,
            },
        });

        return NextResponse.json(supplier);
    } catch (error) {
        console.error("Update supplier error:", error);
        return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
    }
}

// DELETE /api/suppliers/[id]
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.supplier.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete supplier error:", error);
        return NextResponse.json({ error: "Failed to delete supplier" }, { status: 500 });
    }
}
