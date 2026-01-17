import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/api-auth";

export async function POST(req: Request) {
    try {
        const companyId = await getCompanyId();
        if (!companyId) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const { messages, apiKey, model } = await req.json();

        // Check for API key
        const openrouterKey = apiKey || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

        if (!openrouterKey) {
            return new Response(JSON.stringify({
                error: "No API key configured. Go to Settings → AI Settings to add your OpenRouter API key."
            }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Fetch company financial data for context
        const [invoices, expenses, clients, bankAccounts] = await Promise.all([
            prisma.invoice.findMany({
                where: { companyId },
                include: { items: true, client: true },
            }),
            prisma.expense.findMany({
                where: { companyId },
                include: { category: true },
            }),
            prisma.client.findMany({
                where: { companyId },
            }),
            prisma.bankAccount.findMany({
                where: { companyId },
            }),
        ]);

        // Calculate summaries
        const paidInvoices = invoices.filter((i) => i.status === "PAID");
        const revenue = paidInvoices.reduce(
            (sum, inv) => sum + inv.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0),
            0
        );
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const overdueCount = invoices.filter((i) => i.status === "OVERDUE").length;
        const pendingCount = invoices.filter((i) => i.status === "SENT").length;
        const cashBalance = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);

        // Top clients
        const clientRevenue: Record<string, number> = {};
        paidInvoices.forEach((inv) => {
            const clientName = inv.client.name;
            const amount = inv.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
            clientRevenue[clientName] = (clientRevenue[clientName] || 0) + amount;
        });
        const topClients = Object.entries(clientRevenue)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, revenue]) => `${name}: $${revenue.toLocaleString()}`);

        // Expense by category
        const categoryExpenses: Record<string, number> = {};
        expenses.forEach((exp) => {
            const cat = exp.category?.name || "Uncategorized";
            categoryExpenses[cat] = (categoryExpenses[cat] || 0) + exp.amount;
        });

        const systemPrompt = `You are a helpful financial AI assistant for BrownLedger accounting software.

COMPANY FINANCIAL SUMMARY:
- Total Revenue (Paid): $${revenue.toLocaleString()}
- Total Expenses: $${totalExpenses.toLocaleString()}
- Net Profit: $${(revenue - totalExpenses).toLocaleString()}
- Profit Margin: ${revenue > 0 ? ((revenue - totalExpenses) / revenue * 100).toFixed(1) : 0}%
- Cash Balance: $${cashBalance.toLocaleString()}
- Overdue Invoices: ${overdueCount}
- Pending Invoices: ${pendingCount}
- Total Clients: ${clients.length}

TOP CLIENTS BY REVENUE:
${topClients.join("\n")}

EXPENSES BY CATEGORY:
${Object.entries(categoryExpenses).map(([cat, amt]) => `${cat}: $${amt.toLocaleString()}`).join("\n")}

RECENT INVOICES:
${invoices.slice(0, 5).map((i) => `${i.invoiceNumber}: ${i.client.name} - ${i.status}`).join("\n")}

Answer the user's financial questions based on this real data. Be helpful, concise, and accurate. If asked for advice, provide actionable recommendations.`;

        // Use OpenRouter API
        const selectedModel = model || "google/gemini-2.0-flash-exp:free";

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openrouterKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://brownledger.app",
                "X-Title": "BrownLedger AI Chat",
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages,
                ],
                stream: true,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("OpenRouter error:", error);
            return new Response(JSON.stringify({
                error: `OpenRouter API error: ${response.status}`
            }), {
                status: response.status,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Stream the response
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body?.getReader();
                if (!reader) {
                    controller.close();
                    return;
                }

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        const lines = chunk.split("\n").filter(line => line.trim());

                        for (const line of lines) {
                            if (line.startsWith("data: ")) {
                                const data = line.slice(6);
                                if (data === "[DONE]") continue;

                                try {
                                    const json = JSON.parse(data);
                                    const content = json.choices?.[0]?.delta?.content;
                                    if (content) {
                                        controller.enqueue(encoder.encode(content));
                                    }
                                } catch {
                                    // Skip invalid JSON chunks
                                }
                            }
                        }
                    }
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
            },
        });
    } catch (error) {
        console.error("AI chat error:", error);
        return new Response(JSON.stringify({ error: "AI service unavailable" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

