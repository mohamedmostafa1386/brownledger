import { NextResponse } from "next/server";
import { generateInvoiceFromDescription, createInvoiceFromAI } from "@/lib/ai/generate-invoice";
import { requireCompanyId } from "@/lib/api-auth";

export async function POST(request: Request) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;
        const { description, createImmediately } = await request.json();

        if (!description) {
            return NextResponse.json(
                { error: "Description is required" },
                { status: 400 }
            );
        }

        if (createImmediately) {
            // Create the invoice directly
            const invoice = await createInvoiceFromAI(description, companyId);
            return NextResponse.json({
                success: true,
                invoice,
                message: `Created invoice ${invoice.invoiceNumber} for ${invoice.client.name}`
            });
        } else {
            // Just generate the data for preview
            const generated = await generateInvoiceFromDescription(description, companyId);
            return NextResponse.json({
                success: true,
                preview: generated
            });
        }
    } catch (error) {
        console.error("AI invoice generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate invoice" },
            { status: 500 }
        );
    }
}
