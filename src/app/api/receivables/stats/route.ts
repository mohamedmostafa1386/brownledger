import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Get total receivables (unpaid/partially paid invoices)
        const invoices = await prisma.invoice.findMany({
            where: {
                paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] }
            },
            select: { balanceDue: true, dueDate: true }
        });

        const totalReceivables = invoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

        // Unapplied payments
        const unappliedPaymentsData = await prisma.payment.findMany({
            where: { unappliedAmount: { gt: 0 } },
            select: { unappliedAmount: true }
        });
        const unappliedPayments = unappliedPaymentsData.reduce((sum, p) => sum + p.unappliedAmount, 0);

        // Pending checks
        const pendingChecksData = await prisma.payment.findMany({
            where: {
                paymentMethod: "CHECK",
                checkStatus: { in: ["RECEIVED", "DEPOSITED"] }
            },
            select: { totalAmount: true }
        });
        const pendingChecks = pendingChecksData.reduce((sum, p) => sum + p.totalAmount, 0);

        // Collected today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const collectedTodayData = await prisma.payment.findMany({
            where: {
                paymentDate: { gte: today }
            },
            select: { totalAmount: true }
        });
        const collectedToday = collectedTodayData.reduce((sum, p) => sum + p.totalAmount, 0);

        // Overdue amount
        const now = new Date();
        const overdueInvoices = invoices.filter(inv => new Date(inv.dueDate) < now);
        const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

        // AR Aging buckets
        const agingBuckets = invoices.reduce((acc, inv) => {
            const daysPast = Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
            if (daysPast <= 0) acc.current += inv.balanceDue || 0;
            else if (daysPast <= 30) acc.days1to30 += inv.balanceDue || 0;
            else if (daysPast <= 60) acc.days31to60 += inv.balanceDue || 0;
            else if (daysPast <= 90) acc.days61to90 += inv.balanceDue || 0;
            else acc.over90 += inv.balanceDue || 0;
            return acc;
        }, { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, over90: 0 });

        return NextResponse.json({
            totalReceivables,
            unappliedPayments,
            unappliedCount: unappliedPaymentsData.length,
            pendingChecks,
            pendingChecksCount: pendingChecksData.length,
            collectedToday,
            overdueAmount,
            agingCurrent: agingBuckets.current,
            aging1to30: agingBuckets.days1to30,
            aging31to60: agingBuckets.days31to60,
            aging61to90: agingBuckets.days61to90,
            agingOver90: agingBuckets.over90,
        });
    } catch (error) {
        console.error("Error fetching receivables stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
