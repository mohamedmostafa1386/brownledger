import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";

// IFRS-Compliant Financial Ratios
// Based on IAS 1 Statement of Financial Position and Statement of Profit or Loss
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        // Get all active accounts
        const accounts = await prisma.account.findMany({
            where: { companyId, isActive: true },
        });

        // IFRS-aligned totals
        let currentAssets = 0;
        let nonCurrentAssets = 0;
        let totalAssets = 0;
        let inventory = 0;
        let cashAndEquivalents = 0;
        let tradeReceivables = 0;
        let currentLiabilities = 0;
        let nonCurrentLiabilities = 0;
        let totalLiabilities = 0;
        let totalEquity = 0;
        let revenue = 0;
        let costOfSales = 0;
        let operatingExpenses = 0;
        let financeCosts = 0;

        for (const account of accounts) {
            const balance = account.currentBalance;

            switch (account.accountType) {
                case "ASSET":
                    totalAssets += balance;
                    if (account.accountCategory === "CURRENT_ASSET") {
                        currentAssets += balance;
                        if (account.accountCode === "1200") inventory = balance;
                        if (account.accountCode.startsWith("10")) cashAndEquivalents += balance;
                        if (account.accountCode === "1100") tradeReceivables = balance;
                    } else {
                        nonCurrentAssets += balance;
                    }
                    break;
                case "LIABILITY":
                    totalLiabilities += balance;
                    if (account.accountCategory === "CURRENT_LIABILITY") {
                        currentLiabilities += balance;
                    } else {
                        nonCurrentLiabilities += balance;
                    }
                    break;
                case "EQUITY":
                    totalEquity += balance;
                    break;
                case "REVENUE":
                    revenue += balance;
                    break;
                case "EXPENSE":
                    if (account.accountCategory === "COST_OF_GOODS_SOLD") {
                        costOfSales += balance;
                    } else if (account.accountCategory === "OTHER_EXPENSE") {
                        financeCosts += balance;
                    } else {
                        operatingExpenses += balance;
                    }
                    break;
            }
        }

        // IFRS Profit Calculations
        const grossProfit = revenue - costOfSales;
        const operatingProfit = grossProfit - operatingExpenses;
        const profitBeforeTax = operatingProfit - financeCosts;
        const profitForPeriod = profitBeforeTax; // Simplified (no tax calculation)

        // IFRS Financial Ratios
        const ratios = {
            // LIQUIDITY RATIOS (IAS 1 current/non-current classification)
            currentRatio: {
                value: currentLiabilities > 0 ? currentAssets / currentLiabilities : null,
                name: "Current Ratio",
                description: "Current Assets / Current Liabilities (per IAS 1 classification)",
                benchmark: "≥ 1.5",
            },
            quickRatio: {
                value: currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : null,
                name: "Quick Ratio (Acid Test)",
                description: "(Current Assets - Inventory) / Current Liabilities",
                benchmark: "≥ 1.0",
            },
            cashRatio: {
                value: currentLiabilities > 0 ? cashAndEquivalents / currentLiabilities : null,
                name: "Cash Ratio",
                description: "Cash and Cash Equivalents / Current Liabilities",
                benchmark: "≥ 0.2",
            },

            // PROFITABILITY RATIOS (per IAS 1 Statement of Profit or Loss)
            grossProfitMargin: {
                value: revenue > 0 ? (grossProfit / revenue) * 100 : null,
                name: "Gross Profit Margin",
                description: "Gross Profit / Revenue × 100 (after Cost of Sales)",
                benchmark: "≥ 40%",
                unit: "%",
            },
            operatingProfitMargin: {
                value: revenue > 0 ? (operatingProfit / revenue) * 100 : null,
                name: "Operating Profit Margin",
                description: "Operating Profit / Revenue × 100 (after Operating Expenses)",
                benchmark: "≥ 15%",
                unit: "%",
            },
            netProfitMargin: {
                value: revenue > 0 ? (profitForPeriod / revenue) * 100 : null,
                name: "Net Profit Margin",
                description: "Profit for the Period / Revenue × 100",
                benchmark: "≥ 10%",
                unit: "%",
            },
            returnOnAssets: {
                value: totalAssets > 0 ? (profitForPeriod / totalAssets) * 100 : null,
                name: "Return on Assets (ROA)",
                description: "Profit for Period / Total Assets × 100",
                benchmark: "≥ 10%",
                unit: "%",
            },
            returnOnEquity: {
                value: totalEquity > 0 ? (profitForPeriod / totalEquity) * 100 : null,
                name: "Return on Equity (ROE)",
                description: "Profit for Period / Total Equity × 100",
                benchmark: "≥ 15%",
                unit: "%",
            },

            // EFFICIENCY RATIOS
            assetTurnover: {
                value: totalAssets > 0 ? revenue / totalAssets : null,
                name: "Asset Turnover",
                description: "Revenue / Total Assets",
                benchmark: "≥ 1.5",
            },
            inventoryTurnover: {
                value: inventory > 0 ? costOfSales / inventory : null,
                name: "Inventory Turnover",
                description: "Cost of Sales / Average Inventory (IAS 2)",
                benchmark: "≥ 6",
            },
            receivablesDays: {
                value: revenue > 0 ? (tradeReceivables / revenue) * 365 : null,
                name: "Trade Receivables Days",
                description: "(Trade Receivables / Revenue) × 365",
                benchmark: "≤ 30 days",
                unit: "days",
            },

            // LEVERAGE RATIOS (IAS 1 equity and liabilities)
            debtToEquity: {
                value: totalEquity > 0 ? totalLiabilities / totalEquity : null,
                name: "Debt to Equity Ratio",
                description: "Total Liabilities / Total Equity",
                benchmark: "≤ 1.0",
            },
            debtRatio: {
                value: totalAssets > 0 ? totalLiabilities / totalAssets : null,
                name: "Debt Ratio",
                description: "Total Liabilities / Total Assets",
                benchmark: "≤ 0.5",
            },
            equityRatio: {
                value: totalAssets > 0 ? totalEquity / totalAssets : null,
                name: "Equity Ratio",
                description: "Total Equity / Total Assets",
                benchmark: "≥ 0.5",
            },
        };

        // Evaluate health status
        const evaluateRatio = (key: string, value: number | null) => {
            if (value === null) return { status: "N/A", color: "gray" };

            const thresholds: Record<string, { good: number; fair: number; inverse?: boolean }> = {
                currentRatio: { good: 1.5, fair: 1.0 },
                quickRatio: { good: 1.0, fair: 0.8 },
                cashRatio: { good: 0.5, fair: 0.2 },
                grossProfitMargin: { good: 40, fair: 20 },
                operatingProfitMargin: { good: 15, fair: 8 },
                netProfitMargin: { good: 10, fair: 5 },
                returnOnAssets: { good: 10, fair: 5 },
                returnOnEquity: { good: 15, fair: 10 },
                assetTurnover: { good: 1.5, fair: 1.0 },
                inventoryTurnover: { good: 6, fair: 4 },
                receivablesDays: { good: 30, fair: 60, inverse: true },
                debtToEquity: { good: 1.0, fair: 2.0, inverse: true },
                debtRatio: { good: 0.5, fair: 0.7, inverse: true },
                equityRatio: { good: 0.5, fair: 0.3 },
            };

            const t = thresholds[key];
            if (!t) return { status: "N/A", color: "gray" };

            if (t.inverse) {
                if (value <= t.good) return { status: "GOOD", color: "green" };
                if (value <= t.fair) return { status: "FAIR", color: "yellow" };
                return { status: "POOR", color: "red" };
            } else {
                if (value >= t.good) return { status: "GOOD", color: "green" };
                if (value >= t.fair) return { status: "FAIR", color: "yellow" };
                return { status: "POOR", color: "red" };
            }
        };

        // Build response
        const ratioAnalysis = Object.entries(ratios).map(([key, data]) => ({
            key,
            ...data,
            value: data.value !== null ? Math.round(data.value * 100) / 100 : null,
            ...evaluateRatio(key, data.value),
        }));

        // Overall health
        const scores = ratioAnalysis.filter(r => r.status !== "N/A");
        const goodCount = scores.filter(r => r.status === "GOOD").length;
        const fairCount = scores.filter(r => r.status === "FAIR").length;
        const poorCount = scores.filter(r => r.status === "POOR").length;
        const healthScore = scores.length > 0 ? (goodCount * 3 + fairCount * 2 + poorCount * 1) / (scores.length * 3) : 0;

        let overallHealth: string;
        if (healthScore >= 0.9) overallHealth = "EXCELLENT";
        else if (healthScore >= 0.7) overallHealth = "GOOD";
        else if (healthScore >= 0.5) overallHealth = "FAIR";
        else if (healthScore >= 0.3) overallHealth = "POOR";
        else overallHealth = "CRITICAL";

        return NextResponse.json({
            standard: "IFRS / IAS 1",
            ratios: ratioAnalysis,
            categories: {
                liquidity: ratioAnalysis.slice(0, 3),
                profitability: ratioAnalysis.slice(3, 8),
                efficiency: ratioAnalysis.slice(8, 11),
                leverage: ratioAnalysis.slice(11),
            },
            totals: {
                currentAssets,
                nonCurrentAssets,
                totalAssets,
                currentLiabilities,
                nonCurrentLiabilities,
                totalLiabilities,
                totalEquity,
                revenue,
                grossProfit,
                operatingProfit,
                profitForPeriod,
            },
            overallHealth,
            healthScore: Math.round(healthScore * 100),
            summary: { good: goodCount, fair: fairCount, poor: poorCount },
        });
    } catch (error) {
        console.error("Error calculating IFRS ratios:", error);
        return NextResponse.json({ error: "Failed to calculate ratios" }, { status: 500 });
    }
}

// AI Analysis (unchanged)
export async function POST(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const { ratios, totals } = await request.json();

        const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({
                assessment: "AI analysis requires API key configuration.",
                strengths: [],
                improvements: [],
                recommendations: ["Configure OPENROUTER_API_KEY for AI analysis"],
            });
        }

        const prompt = `Analyze these IFRS financial ratios and provide recommendations:
        
Financial Summary (IFRS):
- Total Assets: ${totals.totalAssets}
- Total Equity: ${totals.totalEquity}
- Revenue: ${totals.revenue}
- Profit for Period: ${totals.profitForPeriod}

Key Ratios:
${ratios.map((r: any) => `- ${r.name}: ${r.value} (${r.status})`).join("\n")}

Provide JSON with: assessment, strengths (array), improvements (array), recommendations (array)`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: "meta-llama/llama-3.2-3b-instruct:free",
                messages: [
                    { role: "system", content: "You are an IFRS financial analyst. Respond only with valid JSON." },
                    { role: "user", content: prompt },
                ],
            }),
        });

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "{}";

        let analysis;
        try {
            const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
            analysis = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : content);
        } catch {
            analysis = { assessment: content, strengths: [], improvements: [], recommendations: [] };
        }

        return NextResponse.json(analysis);
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ assessment: "Analysis unavailable.", strengths: [], improvements: [], recommendations: [] });
    }
}
