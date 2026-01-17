import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";
import { permissions, canAccessModule } from "@/lib/rbac";

// GET /api/clients - Fetch all clients
export async function GET() {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!canAccessModule(role, "clients")) {
            return NextResponse.json({ error: "Forbidden: Access to clients is restricted" }, { status: 403 });
        }

        const clients = await prisma.client.findMany({
            where: { companyId },
            include: {
                invoices: {
                    include: { items: true },
                },
            },
            orderBy: { name: "asc" },
        });

        const formatted = clients.map((client) => {
            const totalRevenue = client.invoices
                .filter((inv) => inv.status === "PAID")
                .reduce((sum, inv) => {
                    const invoiceTotal = inv.items.reduce(
                        (s, item) => s + item.quantity * item.unitPrice,
                        0
                    ) * (1 + inv.taxRate);
                    return sum + invoiceTotal;
                }, 0);

            return {
                id: client.id,
                name: client.name,
                email: client.email,
                phone: client.phone,
                invoiceCount: client.invoices.length,
                totalRevenue: Math.round(totalRevenue),
            };
        });

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Clients API error:", error);
        return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
    }
}

// POST /api/clients - Create new client
export async function POST(request: Request) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canManageClients(role)) {
            return NextResponse.json({ error: "Forbidden: Only authorized roles can manage client master data" }, { status: 403 });
        }

        const body = await request.json();

        const client = await prisma.client.create({
            data: {
                companyId,
                name: body.name,
                email: body.email,
                phone: body.phone,
                address: body.address,
                paymentTerms: body.paymentTerms || 30,
            },
        });

        return NextResponse.json(client, { status: 201 });
    } catch (error) {
        console.error("Create client error:", error);
        return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
    }
}
