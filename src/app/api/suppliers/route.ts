import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";
import { permissions, canAccessModule } from "@/lib/rbac";

// GET /api/suppliers - Fetch all suppliers
export async function GET(request: Request) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!canAccessModule(role, "suppliers")) {
            return NextResponse.json({ error: "Forbidden: Access to suppliers is restricted" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const activeOnly = searchParams.get("active") === "true";

        const suppliers = await prisma.supplier.findMany({
            where: {
                companyId,
                isActive: activeOnly ? true : undefined,
                OR: search
                    ? [
                        { name: { contains: search } },
                        { email: { contains: search } },
                        { contactPerson: { contains: search } },
                    ]
                    : undefined,
            },
            include: {
                _count: {
                    select: { bills: true, expenses: true, purchaseOrders: true },
                },
            },
            orderBy: { name: "asc" },
        });

        // Calculate total spent per supplier
        const suppliersWithStats = await Promise.all(
            suppliers.map(async (supplier) => {
                const bills = await prisma.bill.findMany({
                    where: { supplierId: supplier.id, status: "PAID" },
                    include: { items: true },
                });
                const totalSpent = bills.reduce((sum, bill) => {
                    return sum + bill.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
                }, 0);
                return { ...supplier, totalSpent };
            })
        );

        return NextResponse.json(suppliersWithStats);
    } catch (error) {
        console.error("Suppliers API error:", error);
        return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
    }
}

// POST /api/suppliers - Create new supplier
export async function POST(request: Request) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canManageSuppliers(role)) {
            return NextResponse.json({ error: "Forbidden: Only authorized roles can manage suppliers" }, { status: 403 });
        }

        const body = await request.json();

        const supplier = await prisma.supplier.create({
            data: {
                companyId,
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
                paymentTerms: body.paymentTerms || 30,
                currency: body.currency || "USD",
                bankAccount: body.bankAccount,
                notes: body.notes,
                rating: body.rating || 0,
            },
        });

        return NextResponse.json(supplier, { status: 201 });
    } catch (error) {
        console.error("Create supplier error:", error);
        return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
    }
}
