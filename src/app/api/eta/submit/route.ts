import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    convertToETAFormat,
    submitToETA,
    getETADocumentStatus,
    validateEgyptianTaxId,
} from "@/lib/eta-einvoicing";
import { requireCompanyId } from "@/lib/api-auth";
import { permissions } from "@/lib/rbac";

// Submit invoice to ETA
export async function POST(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canPostJournals(role)) {
            return NextResponse.json({ error: "Forbidden: Only accountants or admins can submit to ETA" }, { status: 403 });
        }

        const body = await request.json();
        const { invoiceId } = body;

        if (!invoiceId) {
            return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
        }

        // Get invoice with items and client
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                client: true,
                items: true,
            },
        });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        // Get company details
        const company = await prisma.company.findUnique({
            where: { id: companyId },
        });

        if (!company) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }

        // Validate company tax ID
        const companyTaxValidation = validateEgyptianTaxId(company.taxId || "");
        if (!companyTaxValidation.valid) {
            return NextResponse.json(
                { error: `Invalid company tax ID: ${companyTaxValidation.error}` },
                { status: 400 }
            );
        }

        // Validate client tax ID
        if (invoice.client?.taxId) {
            const clientTaxValidation = validateEgyptianTaxId(invoice.client.taxId);
            if (!clientTaxValidation.valid) {
                return NextResponse.json(
                    { error: `Invalid client tax ID: ${clientTaxValidation.error}` },
                    { status: 400 }
                );
            }
        }

        // Convert to ETA format
        const etaInvoice = convertToETAFormat(invoice, company);

        // Submit to ETA
        const result = await submitToETA(etaInvoice);

        if (result.success) {
            // Update invoice with ETA details
            await prisma.invoice.update({
                where: { id: invoiceId },
                data: {
                    etaUuid: result.uuid,
                    etaSubmissionId: result.submissionId,
                    etaStatus: "SUBMITTED",
                    etaSubmittedAt: new Date(),
                },
            });

            return NextResponse.json({
                success: true,
                uuid: result.uuid,
                submissionId: result.submissionId,
                message: "Invoice submitted to ETA successfully",
            });
        } else {
            return NextResponse.json({
                success: false,
                errors: result.errors,
                message: "ETA submission failed",
            }, { status: 400 });
        }
    } catch (error) {
        console.error("ETA submission error:", error);
        return NextResponse.json(
            { error: "Failed to submit to ETA" },
            { status: 500 }
        );
    }
}

// Get ETA status for invoice
export async function GET(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const { searchParams } = new URL(request.url);
        const invoiceId = searchParams.get("invoiceId");
        const uuid = searchParams.get("uuid");

        if (!invoiceId && !uuid) {
            return NextResponse.json(
                { error: "Invoice ID or UUID is required" },
                { status: 400 }
            );
        }

        let etaUuid = uuid;

        // If invoice ID provided, get UUID from database
        if (invoiceId) {
            const invoice = await prisma.invoice.findUnique({
                where: { id: invoiceId },
                select: { etaUuid: true, etaStatus: true },
            });

            if (!invoice?.etaUuid) {
                return NextResponse.json({
                    status: "NOT_SUBMITTED",
                    message: "Invoice has not been submitted to ETA",
                });
            }

            etaUuid = invoice.etaUuid;
        }

        // Get status from ETA
        const status = await getETADocumentStatus(etaUuid!);

        // Update invoice status in database
        if (invoiceId) {
            await prisma.invoice.update({
                where: { id: invoiceId },
                data: {
                    etaStatus: status.status.toUpperCase(),
                    etaLongId: status.longId,
                    etaPublicUrl: status.publicUrl,
                },
            });
        }

        return NextResponse.json({
            uuid: etaUuid,
            status: status.status,
            longId: status.longId,
            publicUrl: status.publicUrl,
        });
    } catch (error) {
        console.error("ETA status check error:", error);
        return NextResponse.json(
            { error: "Failed to get ETA status" },
            { status: 500 }
        );
    }
}
