import { NextResponse } from "next/server";
import { forecastCashFlow } from "@/lib/ai/forecast-cashflow";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const months = parseInt(searchParams.get("months") || "3");
        const companyId = "demo-company";

        const forecast = await forecastCashFlow(companyId, months);

        return NextResponse.json({ forecast });
    } catch (error) {
        console.error("Forecast API error:", error);
        return NextResponse.json(
            { error: "Failed to generate forecast", forecast: [] },
            { status: 500 }
        );
    }
}
