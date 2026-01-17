import { NextResponse } from "next/server";
import { generateFinancialInsights } from "@/lib/ai/generate-insights";
import { getCompanyId } from "@/lib/api-auth";

export async function GET() {
    try {
        const companyId = await getCompanyId();
        if (!companyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const insights = await generateFinancialInsights(companyId);

        return NextResponse.json({ insights });
    } catch (error) {
        console.error("AI insights API error:", error);
        return NextResponse.json(
            { error: "Failed to generate insights", insights: [] },
            { status: 500 }
        );
    }
}

