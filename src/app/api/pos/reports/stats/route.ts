import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";

// GET /api/pos/reports/stats
export async function GET(request: Request) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Today's sales
        const todaySales = await prisma.pOSSale.findMany({
            where: {
                companyId,
                saleDate: { gte: today, lt: tomorrow },
                status: "COMPLETED",
            },
            include: { items: true },
        });

        const todayTotal = todaySales.reduce((sum, sale) => sum + sale.total, 0);
        const todayTransactions = todaySales.length;
        const avgTransaction = todayTransactions > 0 ? todayTotal / todayTransactions : 0;

        // Top products today
        const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
        for (const sale of todaySales) {
            for (const item of sale.items) {
                if (!productSales[item.productId]) {
                    productSales[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
                }
                productSales[item.productId].quantity += item.quantity;
                productSales[item.productId].revenue += item.total;
            }
        }
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // Payment methods breakdown
        const paymentMethods: Record<string, number> = {};
        for (const sale of todaySales) {
            paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + sale.total;
        }

        // Sales by hour
        const salesByHour: Record<number, number> = {};
        for (const sale of todaySales) {
            const hour = new Date(sale.saleDate).getHours();
            salesByHour[hour] = (salesByHour[hour] || 0) + sale.total;
        }
        const salesByHourArray = Array.from({ length: 24 }, (_, i) => ({
            hour: `${i}:00`,
            sales: salesByHour[i] || 0,
        }));

        // Weekly comparison
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const lastWeekSales = await prisma.pOSSale.aggregate({
            where: {
                companyId,
                saleDate: { gte: weekAgo, lt: today },
                status: "COMPLETED",
            },
            _sum: { total: true },
        });

        return NextResponse.json({
            todaySales: todayTotal,
            todayTransactions,
            avgTransaction,
            topProduct: topProducts[0] || null,
            topProducts,
            paymentMethods: Object.entries(paymentMethods).map(([method, amount]) => ({
                method,
                amount,
            })),
            salesByHour: salesByHourArray,
            lastWeekTotal: lastWeekSales._sum.total || 0,
        });
    } catch (error) {
        console.error("POS Stats API error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
