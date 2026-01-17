import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";

// GET /api/invoices - Fetch all invoices
export async function GET() {
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
            orderBy: { createdAt: "desc" },
        });

        const formatted = invoices.map((inv) => {
            const total = inv.items.reduce(
                (sum, item) => sum + item.quantity * item.unitPrice,
                0
            ) * (1 + inv.taxRate);

            return {
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                clientName: inv.client.name,
                issueDate: inv.issueDate,
                dueDate: inv.dueDate,
                status: inv.status,
                total: Math.round(total * 100) / 100,
            };
        });

        return NextResponse.json(formatted);
    } catch (error) {
        console.error("Invoices API error:", error);
        return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
    }
}

// POST /api/invoices - Create new invoice
export async function POST(request: Request) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const body = await request.json();

        const invoice = await prisma.invoice.create({
            data: {
                companyId,
                clientId: body.clientId,
                invoiceNumber: body.invoiceNumber,
                issueDate: new Date(body.issueDate),
                dueDate: new Date(body.dueDate),
                taxRate: body.taxRate / 100,
                notes: body.notes,
                items: {
                    create: body.items.map((item: { description: string; quantity: number; unitPrice: number }) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                    })),
                },
            },
            include: { items: true },
        });

        return NextResponse.json(invoice, { status: 201 });
    } catch (error) {
        console.error("Create invoice error:", error);
        return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
    }
}

