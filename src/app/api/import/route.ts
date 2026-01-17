import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
    const auth = await requireCompanyId();
    if (!auth || "error" in auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { companyId } = auth;

    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get("action");
        const data = await request.json();

        if (!Array.isArray(data)) {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }

        let resultCount = 0;

        switch (action) {
            case "accounts":
                resultCount = await importAccounts(companyId, data);
                break;
            case "clients":
                resultCount = await importClients(companyId, data);
                break;
            case "suppliers":
                resultCount = await importSuppliers(companyId, data);
                break;
            case "products":
                resultCount = await importProducts(companyId, data);
                break;
            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        return NextResponse.json({ success: true, count: resultCount });
    } catch (error: any) {
        console.error("Import error:", error);
        return NextResponse.json({ error: error.message || "Failed to import data" }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const auth = await requireCompanyId();
    if (!auth || "error" in auth) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { companyId } = auth;

    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get("action");

        let data: any[] = [];

        switch (action) {
            case "accounts":
                data = await prisma.account.findMany({ where: { companyId } });
                break;
            case "clients":
                data = await prisma.client.findMany({ where: { companyId } });
                break;
            case "suppliers":
                data = await prisma.supplier.findMany({ where: { companyId } });
                break;
            case "products":
                data = await prisma.product.findMany({ where: { companyId } });
                break;
            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
    }
}

async function importAccounts(companyId: string, data: any[]) {
    // Collect existing codes to avoid duplicates
    const existing = await prisma.account.findMany({
        where: { companyId },
        select: { accountCode: true }
    });
    const existingCodes = new Set(existing.map(a => a.accountCode));

    const toCreate = data
        .filter(item => item.accountCode && !existingCodes.has(item.accountCode.toString()))
        .map(item => ({
            companyId,
            accountCode: item.accountCode.toString(),
            accountName: item.accountName,
            accountType: item.accountType as any,
            accountCategory: item.accountCategory as any,
            normalBalance: (item.normalBalance || "DEBIT") as any,
        }));

    if (toCreate.length > 0) {
        const result = await prisma.account.createMany({ data: toCreate });
        return result.count;
    }
    return 0;
}

async function importClients(companyId: string, data: any[]) {
    const existing = await prisma.client.findMany({
        where: { companyId },
        select: { name: true }
    });
    const existingNames = new Set(existing.map(c => c.name.toLowerCase()));

    const toCreate = data
        .filter(item => item.name && !existingNames.has(item.name.toLowerCase()))
        .map(item => ({
            companyId,
            name: item.name,
            email: item.email || null,
            phone: item.phone || null,
            address: item.address || null,
            taxId: item.taxId || null,
        }));

    if (toCreate.length > 0) {
        const result = await prisma.client.createMany({ data: toCreate });
        return result.count;
    }
    return 0;
}

async function importSuppliers(companyId: string, data: any[]) {
    const existing = await prisma.supplier.findMany({
        where: { companyId },
        select: { name: true }
    });
    const existingNames = new Set(existing.map(s => s.name.toLowerCase()));

    const toCreate = data
        .filter(item => item.name && !existingNames.has(item.name.toLowerCase()))
        .map(item => ({
            companyId,
            name: item.name,
            contactPerson: item.contactPerson || null,
            email: item.email || null,
            phone: item.phone || null,
            taxId: item.taxId || null,
        }));

    if (toCreate.length > 0) {
        const result = await prisma.supplier.createMany({ data: toCreate });
        return result.count;
    }
    return 0;
}

async function importProducts(companyId: string, data: any[]) {
    const existing = await prisma.product.findMany({
        where: { companyId },
        select: { sku: true }
    });
    const existingSkus = new Set(existing.map(p => p.sku.toLowerCase()));

    const toCreate = data
        .filter(item => item.sku && !existingSkus.has(item.sku.toLowerCase()))
        .map(item => ({
            companyId,
            sku: item.sku,
            name: item.name,
            costPrice: parseFloat(item.costPrice || "0"),
            sellingPrice: parseFloat(item.sellingPrice || "0"),
            stockQuantity: parseInt(item.stockQuantity || "0"),
            trackInventory: true,
        }));

    if (toCreate.length > 0) {
        const result = await prisma.product.createMany({ data: toCreate });
        return result.count;
    }
    return 0;
}
