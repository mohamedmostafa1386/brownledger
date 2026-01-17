import { getOpenAI } from "./openai-client";
import { prisma } from "@/lib/prisma";

export interface GeneratedInvoice {
    clientId: string;
    clientName: string;
    items: { description: string; quantity: number; unitPrice: number }[];
    dueDate: Date;
    notes: string;
    isNewClient: boolean;
}

export async function generateInvoiceFromDescription(
    description: string,
    companyId: string = "demo-company"
): Promise<GeneratedInvoice> {
    try {
        // Get existing clients for matching
        const clients = await prisma.client.findMany({
            where: { companyId },
            select: { id: true, name: true },
        });

        const prompt = `Create an invoice from this description: "${description}"

Existing clients: ${clients.map((c) => c.name).join(", ")}

Extract and return JSON:
{
  "clientName": "client name (match existing if possible)",
  "items": [{ "description": "service/product", "quantity": 1, "unitPrice": 100 }],
  "dueDate": "YYYY-MM-DD (default: 30 days from today)",
  "notes": "any notes"
}

Return ONLY valid JSON.`;

        const response = await getOpenAI().chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
            max_tokens: 500,
        });

        const content = response.choices[0].message.content || "{}";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const data = JSON.parse(jsonMatch?.[0] || "{}");

        // Find or identify client
        let client = clients.find(
            (c) => c.name.toLowerCase().includes(data.clientName?.toLowerCase() || "") ||
                data.clientName?.toLowerCase().includes(c.name.toLowerCase())
        );

        // Calculate due date
        let dueDate: Date;
        if (data.dueDate) {
            dueDate = new Date(data.dueDate);
        } else {
            dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);
        }

        return {
            clientId: client?.id || "",
            clientName: data.clientName || "New Client",
            items: data.items || [{ description: "Service", quantity: 1, unitPrice: 0 }],
            dueDate,
            notes: data.notes || "",
            isNewClient: !client,
        };
    } catch (error) {
        console.error("AI invoice generation error:", error);
        throw new Error("Failed to generate invoice from description");
    }
}

export async function createInvoiceFromAI(
    description: string,
    companyId: string = "demo-company"
) {
    const generated = await generateInvoiceFromDescription(description, companyId);

    // Create client if needed
    let clientId = generated.clientId;
    if (!clientId && generated.isNewClient) {
        const newClient = await prisma.client.create({
            data: {
                companyId,
                name: generated.clientName,
                email: "",
                paymentTerms: 30,
            },
        });
        clientId = newClient.id;
    }

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
        where: { companyId },
        orderBy: { invoiceNumber: "desc" },
    });
    const nextNumber = lastInvoice
        ? `INV-${String(parseInt(lastInvoice.invoiceNumber.split("-")[1] || "0") + 1).padStart(3, "0")}`
        : "INV-001";

    // Create invoice
    const invoice = await prisma.invoice.create({
        data: {
            companyId,
            clientId,
            invoiceNumber: nextNumber,
            issueDate: new Date(),
            dueDate: generated.dueDate,
            notes: generated.notes,
            aiGenerated: true,
            items: {
                create: generated.items.map((item) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                })),
            },
        },
        include: { items: true, client: true },
    });

    return invoice;
}
