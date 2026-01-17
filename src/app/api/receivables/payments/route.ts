import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get payments with optional status filter
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const where: any = {};
        if (status === "unapplied") {
            where.unappliedAmount = { gt: 0 };
        } else if (status) {
            where.status = status;
        }

        const payments = await prisma.payment.findMany({
            where,
            include: {
                client: { select: { id: true, name: true } },
                applications: {
                    include: {
                        invoice: { select: { id: true, invoiceNumber: true } }
                    }
                }
            },
            orderBy: { paymentDate: "desc" },
            take: 100,
        });

        return NextResponse.json(payments);
    } catch (error) {
        console.error("Error fetching payments:", error);
        return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
    }
}

// Create new payment
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            clientId,
            paymentDate,
            amount,
            paymentMethod,
            receivedBy,
            checkNumber,
            checkDate,
            bankName,
            bankReference,
            receiverAccount,
            notes,
            autoApply = false,
        } = body;

        // Generate payment number
        const count = await prisma.payment.count();
        const paymentNumber = `PAY-${String(count + 1).padStart(6, "0")}`;

        // Create payment
        const payment = await prisma.payment.create({
            data: {
                companyId: "default-company", // TODO: Get from session
                clientId,
                paymentNumber,
                paymentDate: new Date(paymentDate),
                totalAmount: amount,
                unappliedAmount: amount,
                paymentMethod,
                receivedBy,
                checkNumber,
                checkDate: checkDate ? new Date(checkDate) : null,
                bankName,
                checkStatus: paymentMethod === "CHECK" ? "RECEIVED" : null,
                bankReference,
                receiverAccount,
                notes,
                status: "PENDING",
            },
            include: {
                client: true,
            },
        });

        // Auto-apply if requested
        if (autoApply) {
            await autoMatchPayment(payment.id);
        }

        return NextResponse.json(payment);
    } catch (error) {
        console.error("Error creating payment:", error);
        return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
    }
}

// Auto-match payment to invoices
async function autoMatchPayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { client: true }
    });

    if (!payment) return null;

    // Get open invoices for this client (oldest first - FIFO)
    const openInvoices = await prisma.invoice.findMany({
        where: {
            clientId: payment.clientId,
            paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] },
            balanceDue: { gt: 0 }
        },
        orderBy: { dueDate: "asc" }
    });

    let remaining = payment.unappliedAmount;
    const applications = [];

    // Check for exact match first
    const exactMatch = openInvoices.find(inv => Math.abs(inv.balanceDue - remaining) < 0.01);
    if (exactMatch) {
        applications.push({
            paymentId: payment.id,
            invoiceId: exactMatch.id,
            appliedAmount: exactMatch.balanceDue,
            isAutoMatched: true,
            matchConfidence: 1.0,
            matchReason: "Exact amount match"
        });
        remaining = 0;
    } else {
        // FIFO matching
        for (const invoice of openInvoices) {
            if (remaining <= 0) break;
            const applyAmount = Math.min(invoice.balanceDue, remaining);
            applications.push({
                paymentId: payment.id,
                invoiceId: invoice.id,
                appliedAmount: applyAmount,
                isAutoMatched: true,
                matchConfidence: 0.9,
                matchReason: "FIFO matching"
            });
            remaining -= applyAmount;
        }
    }

    if (applications.length > 0) {
        // Create applications and update records
        await prisma.$transaction([
            ...applications.map(app => prisma.paymentApplication.create({ data: app })),
            prisma.payment.update({
                where: { id: payment.id },
                data: {
                    appliedAmount: payment.totalAmount - remaining,
                    unappliedAmount: remaining,
                    autoMatched: true,
                    status: remaining > 0 ? "PARTIALLY_APPLIED" : "APPLIED"
                }
            }),
            ...applications.map(app => prisma.invoice.update({
                where: { id: app.invoiceId },
                data: {
                    paidAmount: { increment: app.appliedAmount },
                    balanceDue: { decrement: app.appliedAmount },
                }
            }))
        ]);
    }

    return applications;
}
