import { getOpenAI } from "./openai-client";
import { prisma } from "@/lib/prisma";

export interface FinancialInsight {
    type: "warning" | "opportunity" | "info";
    title: string;
    description: string;
    actionable: boolean;
    action?: string;
}

export async function generateFinancialInsights(
    companyId: string = "demo-company"
): Promise<FinancialInsight[]> {
    try {
        // Gather company financial data
        const [invoices, expenses, overdueCount, clients] = await Promise.all([
            prisma.invoice.findMany({
                where: { companyId },
                include: { items: true },
            }),
            prisma.expense.findMany({
                where: { companyId },
            }),
            prisma.invoice.count({
                where: { companyId, status: "OVERDUE" },
            }),
            prisma.client.findMany({
                where: { companyId },
                include: { invoices: { include: { items: true } } },
            }),
        ]);

        // Calculate metrics
        const totalRevenue = invoices
            .filter((i) => i.status === "PAID")
            .reduce((sum, inv) =>
                sum + inv.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0), 0
            );

        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const pendingRevenue = invoices
            .filter((i) => i.status === "SENT")
            .reduce((sum, inv) =>
                sum + inv.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0), 0
            );

        // Top clients by revenue
        const clientRevenue = clients.map((c) => ({
            name: c.name,
            revenue: c.invoices
                .filter((i) => i.status === "PAID")
                .reduce((sum, inv) =>
                    sum + inv.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0), 0
                ),
        })).sort((a, b) => b.revenue - a.revenue);

        const data = {
            totalRevenue: Math.round(totalRevenue),
            totalExpenses: Math.round(totalExpenses),
            profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(1) : 0,
            overdueInvoices: overdueCount,
            pendingRevenue: Math.round(pendingRevenue),
            topClients: clientRevenue.slice(0, 3),
            expenseRatio: totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : 0,
        };

        const prompt = `Analyze this company's financials and provide 3-5 actionable insights:

${JSON.stringify(data, null, 2)}

Return a JSON object with an "insights" array:
{
  "insights": [
    {
      "type": "warning" | "opportunity" | "info",
      "title": "short title",
      "description": "1-2 sentence explanation",
      "actionable": true/false,
      "action": "what to do (if actionable)"
    }
  ]
}

Focus on: cash flow issues, revenue opportunities, expense optimization, overdue payments, client concentration.
Return ONLY valid JSON.`;

        let content = "{}";
        try {
            const response = await getOpenAI().chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.4,
                max_tokens: 800,
            });
            content = response.choices[0].message.content || "{}";
        } catch (apiError) {
            console.error("OpenAI API call failed:", apiError);
            throw apiError; // Re-throw to be caught by outer catch
        }

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        let result = { insights: [] };

        try {
            if (jsonMatch) {
                result = JSON.parse(jsonMatch[0]);
            }
        } catch (parseError) {
            console.error("Failed to parse AI response:", content);
            // Fallback to empty insights
        }

        return result.insights || [];
    } catch (error) {
        console.error("AI insights generation error:", error);

        // Return default insights if AI fails
        return [
            {
                type: "info",
                title: "AI Analysis Unavailable",
                description: "Unable to connect to AI service. Displaying standard financial data.",
                actionable: false,
            },
        ];
    }
}
