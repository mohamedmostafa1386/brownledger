import { NextRequest, NextResponse } from "next/server";
import {
    getFinancialSummary,
    getExpensesByCategory,
} from "@/lib/financial-core";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";
import { permissions } from "@/lib/rbac";

// Helper to get date range from period - SAME AS DASHBOARD for consistency
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
        case "month":
            startDate.setMonth(now.getMonth() - 1);
            break;
        case "this_quarter":
        case "quarter":
            startDate.setMonth(now.getMonth() - 3);
            break;
        case "this_year":
        case "year":
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            // Default: use year-to-date (fiscal year start)
            startDate.setMonth(0);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
    }

    return { startDate, endDate: now };
}

// IFRS-Compliant Statement of Profit or Loss (Income Statement)
// Uses SAME date handling as Dashboard/Reports for consistency
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canViewFinancials(role)) {
            return NextResponse.json({ error: "Forbidden: Only accountants can view financials" }, { status: 403 });
        }
        const period = searchParams.get("period") || "year";
        const startDateParam = searchParams.get("start");
        const endDateParam = searchParams.get("end");

        // Use period-based date range for consistency, or custom dates if provided
        let start: Date;
        let end: Date;

        if (startDateParam && endDateParam) {
            start = new Date(startDateParam);
            end = new Date(endDateParam);
        } else {
            const range = getDateRange(period);
            start = range.startDate;
            end = range.endDate;
        }

        // Get financial summary from centralized calculations
        const summary = await getFinancialSummary(companyId, start, end);

        // Get expense breakdown by category
        const expensesByCategory = await getExpensesByCategory(companyId, 10, start, end);

        // Build revenue breakdown (from invoices by type if available)
        const invoices = await prisma.invoice.findMany({
            where: {
                companyId,
                status: "PAID",
                issueDate: { gte: start, lte: end },
            },
            include: { items: true },
        });

        // Aggregate revenue by type (product vs service - simplified)
        let productRevenue = 0;
        let serviceRevenue = 0;

        invoices.forEach(inv => {
            const subtotal = inv.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
            const total = subtotal * (1 + (inv.taxRate || 0));
            // Simple heuristic: items with quantity > 1 are products, else services
            const isProduct = inv.items.some(item => item.quantity > 1);
            if (isProduct) {
                productRevenue += total;
            } else {
                serviceRevenue += total;
            }
        });

        // Get POS revenue
        const posSales = await prisma.pOSSale.findMany({
            where: {
                companyId,
                status: "COMPLETED",
                saleDate: { gte: start, lte: end },
            },
        });
        const posRevenue = posSales.reduce((sum, sale) => sum + sale.total, 0);
        productRevenue += posRevenue; // POS is product sales

        // Build IFRS-compliant format
        const revenue = [
            { account: "Product Sales", amount: Math.round(productRevenue) },
            { account: "Service Revenue", amount: Math.round(serviceRevenue) },
        ].filter(r => r.amount > 0);

        const cogs = [
            { account: "Cost of Goods Sold", amount: summary.cogs },
        ];

        const expenses = expensesByCategory.map(cat => ({
            account: cat.name,
            amount: cat.value,
        }));

        // Use centralized calculations for consistency
        const totalRevenue = summary.revenue;
        const totalCogs = summary.cogs;
        const grossProfit = summary.grossProfit;
        const totalExpenses = summary.operatingExpenses;
        const operatingProfit = grossProfit - totalExpenses;
        const netIncome = summary.netProfit;

        // Profit margin metrics
        const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
        const operatingProfitMargin = totalRevenue > 0 ? (operatingProfit / totalRevenue) * 100 : 0;
        const netProfitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

        return NextResponse.json({
            // IFRS Metadata
            title: "Statement of Profit or Loss",
            standard: "IFRS / IAS 1",
            periodStart: start.toISOString(),
            periodEnd: end.toISOString(),

            // Revenue section
            revenue,
            totalRevenue,

            // COGS section
            cogs,
            totalCogs,
            grossProfit,

            // Operating expenses
            expenses,
            totalExpenses,
            operatingProfit,

            // Net income
            netIncome,

            // Key metrics
            keyMetrics: {
                grossProfitMargin: Math.round(grossProfitMargin * 100) / 100,
                operatingProfitMargin: Math.round(operatingProfitMargin * 100) / 100,
                netProfitMargin: Math.round(netProfitMargin * 100) / 100,
            },
        });
    } catch (error) {
        console.error("Error generating income statement:", error);
        return NextResponse.json({ error: "Failed to generate income statement" }, { status: 500 });
    }
}
