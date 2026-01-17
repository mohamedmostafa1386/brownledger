import { getOpenAI } from "./openai-client";

export interface ReceiptData {
    vendor: string;
    date: string;
    amount: number;
    items: { description: string; amount: number }[];
    tax: number;
    confidence: number;
}

export async function processReceiptWithAI(imageBase64: string): Promise<ReceiptData> {
    try {
        const response = await getOpenAI().chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Extract expense details from this receipt image. Return JSON with:
{
  "vendor": "store/company name",
  "date": "YYYY-MM-DD",
  "amount": total amount as number,
  "items": [{ "description": "item name", "amount": price as number }],
  "tax": tax amount as number
}

Be precise with numbers. If a field cannot be determined, use null.`,
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${imageBase64}`,
                            },
                        },
                    ],
                },
            ],
            max_tokens: 1000,
        });

        const content = response.choices[0].message.content || "{}";

        // Try to parse JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON found in response");
        }

        const data = JSON.parse(jsonMatch[0]);

        return {
            vendor: data.vendor || "Unknown Vendor",
            date: data.date || new Date().toISOString().split("T")[0],
            amount: typeof data.amount === "number" ? data.amount : 0,
            items: Array.isArray(data.items) ? data.items : [],
            tax: typeof data.tax === "number" ? data.tax : 0,
            confidence: 0.9,
        };
    } catch (error) {
        console.error("Receipt OCR error:", error);
        return {
            vendor: "Unknown",
            date: new Date().toISOString().split("T")[0],
            amount: 0,
            items: [],
            tax: 0,
            confidence: 0,
        };
    }
}

// Fallback using text extraction for simpler receipts
export async function extractTextFromReceipt(text: string): Promise<ReceiptData> {
    try {
        const response = await getOpenAI().chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "user",
                    content: `Parse this receipt text and extract:
{
  "vendor": "store name",
  "date": "YYYY-MM-DD",
  "amount": total as number,
  "items": [{ "description": "item", "amount": price }],
  "tax": tax amount
}

Receipt text:
${text}

Return ONLY valid JSON.`,
                },
            ],
            temperature: 0.2,
            max_tokens: 500,
        });

        const content = response.choices[0].message.content || "{}";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const data = JSON.parse(jsonMatch?.[0] || "{}");

        return {
            vendor: data.vendor || "Unknown",
            date: data.date || new Date().toISOString().split("T")[0],
            amount: data.amount || 0,
            items: data.items || [],
            tax: data.tax || 0,
            confidence: 0.85,
        };
    } catch (error) {
        console.error("Text extraction error:", error);
        throw error;
    }
}
