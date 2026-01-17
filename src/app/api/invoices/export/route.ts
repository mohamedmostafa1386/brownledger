import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createExcelBuffer } from "@/lib/excel";
import { format } from "date-fns";

export async function GET() {
    try {
        const invoices = await prisma.invoice.findMany({
            include: {
                client: true,
                items: true,
            },
            orderBy: { issueDate: "desc" },
        });

        const formatted = invoices.map((inv) => {
            const subtotal = inv.items.reduce(
                (sum, item) => sum + item.quantity * item.unitPrice,
                0
            );
            const tax = subtotal * inv.taxRate;
            const total = subtotal + tax;

            return {
                "Invoice #": inv.invoiceNumber,
                Client: inv.client.name,
                "Issue Date": format(inv.issueDate, "yyyy-MM-dd"),
                "Due Date": format(inv.dueDate, "yyyy-MM-dd"),
                Status: inv.status,
                Subtotal: subtotal.toFixed(2),
                "Tax Rate": `${(inv.taxRate * 100).toFixed(0)}%`,
                Total: total.toFixed(2),
                Currency: inv.currency,
            };
        });

        const buffer = createExcelBuffer(formatted, "Invoices");

        return new NextResponse(buffer, {
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="invoices-${format(
                    new Date(),
                    "yyyy-MM-dd"
                )}.xlsx"`,
            },
        });
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Failed to export" }, { status: 500 });
    }
}
