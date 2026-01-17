import { NextResponse } from "next/server";
import { processReceiptWithAI } from "@/lib/ai/ocr-receipt";
import { categorizeExpense } from "@/lib/ai/categorize-expense";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("receipt") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");

        // Process with AI Vision
        const extracted = await processReceiptWithAI(base64);

        // Auto-categorize the expense
        const categoryResult = await categorizeExpense(
            extracted.vendor,
            extracted.amount,
            extracted.vendor
        );

        return NextResponse.json({
            ...extracted,
            categoryId: categoryResult.category?.id,
            categoryName: categoryResult.category?.name,
        });
    } catch (error) {
        console.error("OCR error:", error);
        return NextResponse.json(
            { error: "Failed to process receipt" },
            { status: 500 }
        );
    }
}
