import { getOpenAI } from "./openai-client";
import { prisma } from "@/lib/prisma";

export interface SupplierMatch {
    matchedSupplierId: string | null;
    matchedSupplierName: string | null;
    confidence: number;
    suggestCreate: boolean;
    reason: string;
}

/**
 * AI-powered supplier matching - matches a vendor name to existing suppliers
 */
export async function aiMatchSupplier(
    vendorName: string,
    companyId: string
): Promise<SupplierMatch> {
    try {
        // Fetch existing suppliers
        const suppliers = await prisma.supplier.findMany({
            where: { companyId, isActive: true },
            select: { id: true, name: true, email: true, phone: true },
        });

        if (suppliers.length === 0) {
            return {
                matchedSupplierId: null,
                matchedSupplierName: null,
                confidence: 0,
                suggestCreate: true,
                reason: "No suppliers in database",
            };
        }

        // Use AI to match
        const prompt = `You are a supplier matching system. Match this vendor name to existing suppliers.

Vendor from expense/bill: "${vendorName}"

Existing Suppliers in database:
${suppliers.map((s, i) => `${i + 1}. "${s.name}" (ID: ${s.id})`).join("\n")}

Analyze and return JSON with:
{
  "matchedSupplierId": "supplier_id or null if no match",
  "matchedSupplierName": "name of matched supplier or null",
  "confidence": 0.0-1.0,
  "suggestCreate": true/false (suggest creating new supplier if no good match),
  "reason": "brief explanation"
}

Consider:
- Exact matches (confidence 1.0)
- Partial matches, abbreviations (e.g., "AWS" = "Amazon Web Services")
- Common variations (e.g., "Microsoft Corp" = "Microsoft")
- Typos/misspellings

Be conservative - only match if confident.`;

        const response = await getOpenAI().chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");

        return {
            matchedSupplierId: result.matchedSupplierId || null,
            matchedSupplierName: result.matchedSupplierName || null,
            confidence: result.confidence || 0,
            suggestCreate: result.suggestCreate ?? true,
            reason: result.reason || "Unknown",
        };
    } catch (error) {
        console.error("AI supplier match error:", error);
        return {
            matchedSupplierId: null,
            matchedSupplierName: null,
            confidence: 0,
            suggestCreate: true,
            reason: "AI matching failed",
        };
    }
}

/**
 * Auto-link an expense to a supplier
 */
export async function linkExpenseToSupplier(
    expenseId: string,
    vendorName: string,
    companyId: string
): Promise<{ linked: boolean; supplierId?: string; supplierName?: string }> {
    const match = await aiMatchSupplier(vendorName, companyId);

    if (match.matchedSupplierId && match.confidence > 0.8) {
        await prisma.expense.update({
            where: { id: expenseId },
            data: { supplierId: match.matchedSupplierId },
        });

        return {
            linked: true,
            supplierId: match.matchedSupplierId,
            supplierName: match.matchedSupplierName || undefined,
        };
    }

    return { linked: false };
}

/**
 * Suggest suppliers for auto-complete based on partial input
 */
export async function suggestSuppliers(
    partialName: string,
    companyId: string,
    limit: number = 5
): Promise<{ id: string; name: string; email: string | null }[]> {
    const suppliers = await prisma.supplier.findMany({
        where: {
            companyId,
            isActive: true,
            name: { contains: partialName },
        },
        select: { id: true, name: true, email: true },
        take: limit,
        orderBy: { name: "asc" },
    });

    return suppliers;
}

/**
 * Generate AI tags for a supplier based on their transaction history
 */
export async function generateSupplierTags(supplierId: string): Promise<string[]> {
    try {
        const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
            include: {
                bills: { include: { items: true }, take: 10 },
                expenses: { take: 10 },
            },
        });

        if (!supplier) return [];

        const descriptions = [
            ...supplier.bills.flatMap((b) => b.items.map((i) => i.description)),
            ...supplier.expenses.map((e) => e.description),
        ];

        if (descriptions.length === 0) return [];

        const prompt = `Based on these transaction descriptions with a supplier, generate 3-5 relevant tags.

Supplier: ${supplier.name}
Transaction descriptions:
${descriptions.slice(0, 20).join("\n")}

Return JSON: { "tags": ["tag1", "tag2", ...] }

Tags should be short category labels like: "office supplies", "software", "consulting", "hardware", etc.`;

        const response = await getOpenAI().chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(response.choices[0].message.content || '{"tags":[]}');
        return result.tags || [];
    } catch (error) {
        console.error("Generate supplier tags error:", error);
        return [];
    }
}
