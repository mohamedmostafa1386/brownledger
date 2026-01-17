import { NextRequest, NextResponse } from "next/server";
import { getCompanyId, requireCompanyId } from "@/lib/api-auth";
import {
    getFinancialSummary,
    getMonthlyData,
    getARAgingBuckets,
} from "@/lib/financial-core";
import { prisma } from "@/lib/prisma";

// Helper to get date range from period
function getDateRange(period: string): { startDate: Date; endDate: Date } {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
        case "today":
            startDate.setHours(0, 0, 0, 0);
            break;
        case "this_week":
            startDate.setDate(now.getDate() - 7);
            break;
        case "this_month":
            startDate.setMonth(now.getMonth() - 1);
            break;
        case "this_quarter":
            startDate.setMonth(now.getMonth() - 3);
            break;
        case "this_year":
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            startDate.setMonth(now.getMonth() - 1);
    }

    return { startDate, endDate: now };
}

// GET /api/dashboard - Fetch dashboard data with date filtering
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get("period") || "this_month";

        // Get company ID from auth, ensure strict multi-tenancy
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const { startDate, endDate } = getDateRange(period);

        // Get comprehensive financial summary with date filtering
        const summary = await getFinancialSummary(companyId, startDate, endDate);

        // Get monthly data for charts (last 6 months)
        const monthlyData = await getMonthlyData(companyId, 6);

        // Get AR aging for pending invoices display (always current, not filtered)
        const arAging = await getARAgingBuckets(companyId);
        const totalPending = arAging.reduce((sum, b) => sum + b.amount, 0);

        // Get recent invoices (most recent, not date filtered)
        const recentInvoices = await prisma.invoice.findMany({
            where: { companyId },
            include: { client: true, items: true },
            orderBy: { createdAt: "desc" },
            take: 5,
        });

        const formattedRecentInvoices = recentInvoices.map((inv) => {
            const subtotal = inv.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
            const total = subtotal * (1 + (inv.taxRate || 0));
            return {
                id: inv.id,
                number: inv.invoiceNumber,
                client: inv.client.name,
                amount: Math.round(total),
                status: inv.status,
            };
        });

        // Format monthly revenue for chart
        const monthlyRevenue = monthlyData.map(m => ({
            name: m.month,
            value: m.revenue,
            expenses: m.expenses,
        }));

        // Get invoice counts for AR summary (within date range)
        const invoices = await prisma.invoice.findMany({
            where: { companyId, issueDate: { gte: startDate, lte: endDate } },
            select: { status: true },
        });
        const paidCount = invoices.filter(i => i.status === "PAID").length;
        const pendingCount = invoices.filter(i => i.status === "PENDING" || i.status === "SENT").length;
        const overdueCount = invoices.filter(i => i.status === "OVERDUE").length;

        return NextResponse.json({
            // Period info
            period,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),

            // Main KPIs from centralized calculations (date filtered)
            revenue: summary.revenue,
            expenses: summary.operatingExpenses,
            cogs: summary.cogs,
            grossProfit: summary.grossProfit,
            profit: summary.netProfit,
            pending: totalPending,
            cash: summary.cashBalance,

            // AR/AP
            accountsReceivable: summary.accountsReceivable,
            accountsPayable: summary.accountsPayable,

            // Monthly chart data
            monthlyRevenue,

            // Recent invoices
            recentInvoices: formattedRecentInvoices,

            // Invoice counts (for selected period)
            invoiceCount: invoices.length,
            paidInvoiceCount: paidCount,
            pendingInvoiceCount: pendingCount,
            overdueInvoiceCount: overdueCount,
        });
    } catch (error) {
        console.error("Dashboard API error:", error);
        return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
    }
}
