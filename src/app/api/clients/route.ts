import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";
import { permissions, canAccessModule } from "@/lib/rbac";
import { apiResponse, apiError, unauthorizedError, forbiddenError } from "@/lib/api-response";

// GET /api/clients - Fetch all clients
export async function GET() {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return unauthorizedError(auth.error);
        }
        const { companyId, role } = auth;

        if (!canAccessModule(role, "clients")) {
            return forbiddenError("Access to clients is restricted");
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

        return apiResponse(formatted);
    } catch (error) {
        console.error("Clients API error:", error);
        return apiError("Failed to fetch clients", "CLIENTS_FETCH_ERROR", 500, error);
    }
}

// POST /api/clients - Create new client
export async function POST(request: Request) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return unauthorizedError(auth.error);
        }
        const { companyId, role } = auth;

        if (!permissions.canManageClients(role)) {
            return forbiddenError("Only authorized roles can manage client master data");
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

        return apiResponse(client, 201);
    } catch (error) {
        console.error("Create client error:", error);
        return apiError("Failed to create client", "CLIENT_CREATE_ERROR", 500, error);
    }
}
