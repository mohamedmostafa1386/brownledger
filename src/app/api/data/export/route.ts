import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Data Export API - Export company data as JSON or prepare for Excel
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId") || "demo-company";
        const format = searchParams.get("format") || "json";
        const dataType = searchParams.get("type") || "all";

        // Get company data
        const company = await prisma.company.findUnique({
            where: { id: companyId },
        });

        if (!company) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }

        let exportData: any = {
            exportDate: new Date().toISOString(),
            company: {
                name: company.name,
                taxId: company.taxId,
                currency: company.currency,
            },
        };

        // Fetch requested data types
        if (dataType === "all" || dataType === "accounts") {
            exportData.chartOfAccounts = await prisma.account.findMany({
                where: { companyId },
                select: {
                    accountCode: true,
                    accountName: true,
                    accountType: true,
                    accountCategory: true,
                    normalBalance: true,
                    currentBalance: true,
                    isActive: true,
                },
            });
        }

        if (dataType === "all" || dataType === "clients") {
            exportData.clients = await prisma.client.findMany({
                where: { companyId },
                select: {
                    name: true,
                    email: true,
                    phone: true,
                    address: true,
                    taxId: true,
                    creditLimit: true,
                    currentBalance: true,
                },
            });
        }

        if (dataType === "all" || dataType === "suppliers") {
            exportData.suppliers = await prisma.supplier.findMany({
                where: { companyId },
                select: {
                    name: true,
                    email: true,
                    phone: true,
                    address: true,
                    taxId: true,
                    paymentTerms: true,
                    currentBalance: true,
                },
            });
        }

        if (dataType === "all" || dataType === "invoices") {
            exportData.invoices = await prisma.invoice.findMany({
                where: { companyId },
                include: {
                    client: { select: { name: true } },
                    items: true,
                },
            });
        }

        if (dataType === "all" || dataType === "expenses") {
            exportData.expenses = await prisma.expense.findMany({
                where: { companyId },
                include: {
                    category: { select: { name: true } },
                },
            });
        }

        if (dataType === "all" || dataType === "products") {
            exportData.products = await prisma.product.findMany({
                where: { companyId },
                select: {
                    sku: true,
                    name: true,
                    description: true,
                    costPrice: true,
                    sellingPrice: true,
                    stockQuantity: true,
                    reorderLevel: true,
                    isActive: true,
                },
            });
        }

        if (dataType === "all" || dataType === "journalEntries") {
            exportData.journalEntries = await prisma.journalEntry.findMany({
                where: { companyId },
                include: {
                    lines: {
                        include: {
                            account: { select: { accountCode: true, accountName: true } },
                        },
                    },
                },
            });
        }

        // Calculate summary
        exportData.summary = {
            totalAccounts: exportData.chartOfAccounts?.length || 0,
            totalClients: exportData.clients?.length || 0,
            totalSuppliers: exportData.suppliers?.length || 0,
            totalInvoices: exportData.invoices?.length || 0,
            totalExpenses: exportData.expenses?.length || 0,
            totalProducts: exportData.products?.length || 0,
            totalJournalEntries: exportData.journalEntries?.length || 0,
        };

        if (format === "download") {
            // Return as downloadable JSON file
            const jsonString = JSON.stringify(exportData, null, 2);
            const fileName = `brownledger-backup-${new Date().toISOString().split("T")[0]}.json`;

            return new NextResponse(jsonString, {
                headers: {
                    "Content-Type": "application/json",
                    "Content-Disposition": `attachment; filename="${fileName}"`,
                },
            });
        }

        return NextResponse.json(exportData);
    } catch (error) {
        console.error("Error exporting data:", error);
        return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
    }
}

// Data Import API (restore from backup)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { data, companyId = "demo-company" } = body;

        if (!data) {
            return NextResponse.json({ error: "No data provided" }, { status: 400 });
        }

        // This would be a full import/restore process
        // For safety, we only log what would be imported
        const summary = {
            accounts: data.chartOfAccounts?.length || 0,
            clients: data.clients?.length || 0,
            suppliers: data.suppliers?.length || 0,
            invoices: data.invoices?.length || 0,
            expenses: data.expenses?.length || 0,
            products: data.products?.length || 0,
            journalEntries: data.journalEntries?.length || 0,
        };

        console.log(`Data import requested for company ${companyId}:`, summary);

        return NextResponse.json({
            success: true,
            message: "Data import preview complete",
            summary,
            warning: "Full import functionality requires manual review for production use",
        });
    } catch (error) {
        console.error("Error importing data:", error);
        return NextResponse.json({ error: "Failed to import data" }, { status: 500 });
    }
}
