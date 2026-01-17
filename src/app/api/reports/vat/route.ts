import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Egypt VAT Rate (currently 14%)
const VAT_RATE = 0.14;

// VAT Report API - Generate VAT summary for Egyptian tax filing
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId") || "demo-company";
        const period = searchParams.get("period") || "month"; // month, quarter, year
        const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
        const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

        // Calculate date range based on period
        let startDate: Date, endDate: Date;

        if (period === "month") {
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0);
        } else if (period === "quarter") {
            const quarter = Math.ceil(month / 3);
            startDate = new Date(year, (quarter - 1) * 3, 1);
            endDate = new Date(year, quarter * 3, 0);
        } else {
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31);
        }

        // Get sales (output VAT)
        const invoices = await prisma.invoice.findMany({
            where: {
                companyId,
                issueDate: { gte: startDate, lte: endDate },
                status: { not: "CANCELLED" },
            },
        });

        // Get purchases (input VAT)
        const expenses = await prisma.expense.findMany({
            where: {
                companyId,
                date: { gte: startDate, lte: endDate },
            },
        });

        const bills = await prisma.bill.findMany({
            where: {
                companyId,
                billDate: { gte: startDate, lte: endDate },
                status: { not: "CANCELLED" },
            },
        });

        // Calculate totals
        const salesTotal = invoices.reduce((sum, inv) => sum + inv.total, 0);
        const salesVAT = invoices.reduce((sum, inv) => sum + (inv.taxAmount || 0), 0);

        const expensesTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const expensesVAT = expenses.reduce((sum, exp) => {
            // Estimate VAT on expenses (if taxable)
            if (exp.taxAmount) return sum + exp.taxAmount;
            // Assume 14% VAT was included in price
            return sum + (exp.amount * VAT_RATE / (1 + VAT_RATE));
        }, 0);

        const billsTotal = bills.reduce((sum, bill) => sum + bill.total, 0);
        const billsVAT = bills.reduce((sum, bill) => sum + (bill.taxAmount || 0), 0);

        const totalInputVAT = expensesVAT + billsVAT;
        const totalOutputVAT = salesVAT;
        const netVAT = totalOutputVAT - totalInputVAT;

        // Generate monthly breakdown
        const monthlyBreakdown = [];
        const monthsInPeriod = period === "month" ? 1 : period === "quarter" ? 3 : 12;

        for (let i = 0; i < monthsInPeriod; i++) {
            const monthStart = new Date(startDate);
            monthStart.setMonth(startDate.getMonth() + i);
            const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

            const monthInvoices = invoices.filter(inv => {
                const date = new Date(inv.issueDate);
                return date >= monthStart && date <= monthEnd;
            });

            const monthExpenses = expenses.filter(exp => {
                const date = new Date(exp.date);
                return date >= monthStart && date <= monthEnd;
            });

            monthlyBreakdown.push({
                month: monthStart.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
                sales: monthInvoices.reduce((sum, inv) => sum + inv.total, 0),
                outputVAT: monthInvoices.reduce((sum, inv) => sum + (inv.taxAmount || 0), 0),
                purchases: monthExpenses.reduce((sum, exp) => sum + exp.amount, 0),
                inputVAT: monthExpenses.reduce((sum, exp) => sum + (exp.taxAmount || exp.amount * VAT_RATE / (1 + VAT_RATE)), 0),
            });
        }

        return NextResponse.json({
            period: {
                type: period,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                label: `${startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}${period !== "month" ? ` - ${endDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}` : ""}`,
            },
            vatRate: VAT_RATE * 100,
            outputVAT: {
                label: "Output VAT (Sales)",
                taxableAmount: Math.round(salesTotal * 100) / 100,
                vatAmount: Math.round(salesVAT * 100) / 100,
                invoiceCount: invoices.length,
            },
            inputVAT: {
                label: "Input VAT (Purchases)",
                expenses: {
                    taxableAmount: Math.round(expensesTotal * 100) / 100,
                    vatAmount: Math.round(expensesVAT * 100) / 100,
                    count: expenses.length,
                },
                bills: {
                    taxableAmount: Math.round(billsTotal * 100) / 100,
                    vatAmount: Math.round(billsVAT * 100) / 100,
                    count: bills.length,
                },
                totalVAT: Math.round(totalInputVAT * 100) / 100,
            },
            netVAT: {
                label: netVAT >= 0 ? "VAT Payable" : "VAT Refundable",
                amount: Math.round(Math.abs(netVAT) * 100) / 100,
                isPayable: netVAT >= 0,
            },
            monthlyBreakdown,
            filingDeadline: new Date(endDate.getFullYear(), endDate.getMonth() + 2, 15).toISOString(),
        });
    } catch (error) {
        console.error("Error generating VAT report:", error);
        return NextResponse.json({ error: "Failed to generate VAT report" }, { status: 500 });
    }
}
