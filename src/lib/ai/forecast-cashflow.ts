import { getOpenAI } from "./openai-client";
import { prisma } from "@/lib/prisma";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface MonthlyData {
    month: string;
    revenue: number;
    expenses: number;
}

interface ForecastData {
    month: string;
    predictedRevenue: number;
    predictedExpenses: number;
    netCashFlow: number;
    confidence: number;
}

async function getHistoricalData(companyId: string): Promise<MonthlyData[]> {
    const months = 12;
    const data: MonthlyData[] = [];

    for (let i = months - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const start = startOfMonth(date);
        const end = endOfMonth(date);

        const invoices = await prisma.invoice.findMany({
            where: {
                companyId,
                status: "PAID",
                issueDate: { gte: start, lte: end },
            },
            include: { items: true },
        });

        const expenses = await prisma.expense.findMany({
            where: {
                companyId,
                date: { gte: start, lte: end },
            },
        });

        const revenue = invoices.reduce((sum, inv) => {
            return sum + inv.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
        }, 0);

        const expenseTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        data.push({
            month: format(date, "yyyy-MM"),
            revenue: Math.round(revenue),
            expenses: Math.round(expenseTotal),
        });
    }

    return data;
}

export async function forecastCashFlow(
    companyId: string = "demo-company",
    forecastMonths: number = 3
): Promise<ForecastData[]> {
    try {
        const historicalData = await getHistoricalData(companyId);

        const prompt = `Based on this 12-month financial history, predict cash flow for the next ${forecastMonths} months:

Historical data (revenue/expenses per month):
${JSON.stringify(historicalData, null, 2)}

Today's date: ${format(new Date(), "yyyy-MM-dd")}

Analyze trends, seasonality, and growth patterns. Return a JSON array with ${forecastMonths} objects:
{
  "forecast": [
    { "month": "YYYY-MM", "predictedRevenue": number, "predictedExpenses": number, "confidence": 0.0-1.0 }
  ]
}

Be realistic based on the historical trends. Return ONLY valid JSON.`;

        const response = await getOpenAI().chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 500,
        });

        const content = response.choices[0].message.content || "{}";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const data = JSON.parse(jsonMatch?.[0] || '{"forecast":[]}');

        return (data.forecast || []).map((f: { month: string; predictedRevenue: number; predictedExpenses: number; confidence: number }) => ({
            month: f.month,
            predictedRevenue: f.predictedRevenue || 0,
            predictedExpenses: f.predictedExpenses || 0,
            netCashFlow: (f.predictedRevenue || 0) - (f.predictedExpenses || 0),
            confidence: f.confidence || 0.7,
        }));
    } catch (error) {
        console.error("Cash flow forecast error:", error);

        // Return mock forecast if AI fails
        const forecast: ForecastData[] = [];
        for (let i = 1; i <= forecastMonths; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() + i);
            forecast.push({
                month: format(date, "yyyy-MM"),
                predictedRevenue: 15000 + Math.random() * 5000,
                predictedExpenses: 10000 + Math.random() * 3000,
                netCashFlow: 5000 + Math.random() * 2000,
                confidence: 0.6,
            });
        }
        return forecast;
    }
}
