import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateArabicInvoicePDF } from "@/lib/arabic-invoice-pdf";
import { requireCompanyId } from "@/lib/api-auth";

// Generate Arabic invoice PDF
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const invoiceId = searchParams.get("invoiceId");

        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        if (!invoiceId) {
            return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
        }

        // Get invoice with items and client, ensuring it belongs to the user's company
        const invoice = await prisma.invoice.findFirst({
            where: { id: invoiceId, companyId },
            include: {
                client: true,
                items: true,
            },
        });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found or access denied" }, { status: 404 });
        }

        // Get company
        const company = await prisma.company.findUnique({
            where: { id: companyId },
        });

        if (!company) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }

        // Prepare invoice data
        const invoiceData = {
            invoiceNumber: invoice.invoiceNumber,
            issueDate: invoice.issueDate.toISOString(),
            dueDate: invoice.dueDate.toISOString(),
            company: {
                name: company.name,
                nameAr: company.nameAr || undefined,
                address: company.address || "",
                taxId: company.taxId || "",
                phone: company.phone || undefined,
                email: company.email || undefined,
            },
            client: {
                name: invoice.client?.name || "",
                nameAr: invoice.client?.nameAr || undefined,
                address: invoice.client?.address || "",
                taxId: invoice.client?.taxId || undefined,
                phone: invoice.client?.phone || undefined,
                email: invoice.client?.email || undefined,
            },
            items: invoice.items.map((item) => ({
                description: item.description,
                descriptionAr: item.descriptionAr || undefined,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
            })),
            subtotal: invoice.subtotal,
            taxRate: 14, // Egyptian VAT rate
            taxAmount: invoice.taxAmount || 0,
            discount: invoice.discount || undefined,
            total: invoice.totalAmount,
            notes: invoice.notes || undefined,
            notesAr: invoice.notesAr || undefined,
            etaUuid: invoice.etaUuid || undefined,
            etaLongId: invoice.etaLongId || undefined,
        };

        // Generate Arabic PDF HTML
        const html = generateArabicInvoicePDF(invoiceData);

        // Return HTML that can be printed/saved as PDF
        return new NextResponse(html, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
            },
        });
    } catch (error) {
        console.error("Error generating Arabic invoice:", error);
        return NextResponse.json(
            { error: "Failed to generate Arabic invoice" },
            { status: 500 }
        );
    }
}
