import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCompanyId } from "@/lib/api-auth";

// GET /api/products - Fetch all products
export async function GET(request: Request) {
    try {
        const companyId = await getCompanyId();
        if (!companyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const category = searchParams.get("category");
        const barcode = searchParams.get("barcode");
        const activeOnly = searchParams.get("active") !== "false";

        // If barcode lookup
        if (barcode) {
            const product = await prisma.product.findFirst({
                where: { companyId, barcode },
                include: { category: true },
            });
            return NextResponse.json(product);
        }

        const products = await prisma.product.findMany({
            where: {
                companyId,
                isActive: activeOnly ? true : undefined,
                categoryId: category || undefined,
                OR: search
                    ? [
                        { name: { contains: search } },
                        { sku: { contains: search } },
                        { barcode: { contains: search } },
                    ]
                    : undefined,
            },
            include: { category: true },
            orderBy: { name: "asc" },
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error("Products API error:", error);
        return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }
}

// POST /api/products - Create new product
export async function POST(request: Request) {
    try {
        const companyId = await getCompanyId();
        if (!companyId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Generate SKU if not provided
        const sku = body.sku || `SKU-${Date.now().toString(36).toUpperCase()}`;

        const product = await prisma.product.create({
            data: {
                companyId,
                sku,
                barcode: body.barcode,
                name: body.name,
                description: body.description,
                categoryId: body.categoryId,
                costPrice: body.costPrice || 0,
                sellingPrice: body.sellingPrice,
                taxRate: body.taxRate || 0,
                stockQuantity: body.stockQuantity || 0,
                lowStockAlert: body.lowStockAlert || 10,
                imageUrl: body.imageUrl,
                trackInventory: body.trackInventory ?? true,
            },
        });

        // Create initial stock movement if stock is added
        if (body.stockQuantity > 0) {
            await prisma.stockMovement.create({
                data: {
                    companyId,
                    productId: product.id,
                    type: "ADJUSTMENT",
                    quantity: body.stockQuantity,
                    notes: "Initial stock",
                },
            });
        }

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error("Create product error:", error);
        return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
}

