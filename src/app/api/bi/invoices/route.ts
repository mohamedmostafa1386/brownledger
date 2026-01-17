import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";

// GET /api/bi/invoices - Power BI compatible JSON endpoint
export async function GET(request: Request) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const invoices = await prisma.invoice.findMany({
            where: { companyId },
            include: {
                client: true,
                items: true,
            },
            orderBy: { issueDate: "desc" },
        });

        // Flatten data for BI tools
        const flattened = invoices.map((inv) => {
            const subtotal = inv.items.reduce(
                (sum, item) => sum + item.quantity * item.unitPrice,
                0
            );
            const tax = subtotal * inv.taxRate;
            const total = subtotal + tax;

            return {
                invoiceId: inv.id,
                invoiceNumber: inv.invoiceNumber,
                clientId: inv.clientId,
                clientName: inv.client.name,
                clientEmail: inv.client.email,
                issueDate: inv.issueDate.toISOString(),
                dueDate: inv.dueDate.toISOString(),
                status: inv.status,
                currency: inv.currency,
                itemCount: inv.items.length,
                subtotal,
                taxRate: inv.taxRate,
                taxAmount: tax,
                total,
                createdAt: inv.createdAt.toISOString(),
                updatedAt: inv.updatedAt.toISOString(),
            };
        });

        return NextResponse.json(flattened, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET",
            },
        });
    } catch (error) {
        console.error("BI API error:", error);
        return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }
}
