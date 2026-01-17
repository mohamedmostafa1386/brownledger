import { getOpenAI } from "./openai-client";
import { prisma } from "@/lib/prisma";

export async function categorizeExpense(
    description: string,
    amount: number,
    vendor?: string,
    companyId: string = "demo-company"
) {
    try {
        const categories = await prisma.expenseCategory.findMany({
            where: { companyId },
        });

        if (categories.length === 0) {
            return { category: null, confidence: 0 };
        }

        const prompt = `Categorize this business expense:
Description: ${description}
Amount: $${amount}
Vendor: ${vendor || "Unknown"}

Available categories: ${categories.map((c) => c.name).join(", ")}

Return ONLY the best matching category name from the list above, nothing else.`;

        const response = await getOpenAI().chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 50,
        });

        const suggestedCategory = response.choices[0].message.content?.trim();
        const matchedCategory = categories.find(
            (c) => c.name.toLowerCase() === suggestedCategory?.toLowerCase()
        );

        return {
            category: matchedCategory || null,
            confidence: matchedCategory ? 0.85 : 0,
            suggestedName: suggestedCategory,
        };
    } catch (error) {
        console.error("AI categorization error:", error);
        return { category: null, confidence: 0, error: "AI service unavailable" };
    }
}

export async function autoCategorizeAndSave(
    expenseId: string,
    description: string,
    amount: number,
    vendor?: string
) {
    const result = await categorizeExpense(description, amount, vendor);

    if (result.category) {
        await prisma.expense.update({
            where: { id: expenseId },
            data: {
                aiCategoryId: result.category.id,
                aiConfidence: result.confidence,
                categoryId: result.category.id,
            },
        });
    }

    return result;
}
