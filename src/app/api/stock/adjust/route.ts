
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";

export async function POST(request: Request) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const body = await request.json();
        const { productId, quantity, reason, warehouseId } = body;

        if (!productId || quantity === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Get current product state
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const result = await prisma.$transaction(async (tx) => {
            let balanceBefore = product.stockQuantity;
            let balanceAfter = balanceBefore + quantity;

            // 1. Update Global Product Stock
            await tx.product.update({
                where: { id: productId },
                data: { stockQuantity: { increment: quantity } }, // Use increment to be safe
            });

            // Check for alerts (Global Stock)
            const newGlobalStock = product.stockQuantity + quantity;
            if (newGlobalStock <= product.lowStockAlert) {
                // Create Alert if not exists OR update existing?
                // For simplicity, just create a new one if no unresolved one exists.
                const existingAlert = await tx.stockAlert.findFirst({
                    where: {
                        companyId,
                        productId,
                        type: "LOW_STOCK",
                        isResolved: false
                    }
                });

                if (!existingAlert) {
                    await tx.stockAlert.create({
                        data: {
                            companyId,
                            productId,
                            type: "LOW_STOCK",
                            message: `Product ${product.name} is low on stock (${newGlobalStock})`,
                            severity: newGlobalStock === 0 ? "CRITICAL" : "HIGH",
                        }
                    });
                }
            } else {
                // Resolve existing low stock alerts
                await tx.stockAlert.updateMany({
                    where: {
                        companyId,
                        productId,
                        type: "LOW_STOCK",
                        isResolved: false
                    },
                    data: {
                        isResolved: true,
                        resolvedAt: new Date()
                    }
                });
            }

            // 2. Update Specific Warehouse Stock (if provided)
            let warehouseBalanceBefore = 0;
            let warehouseBalanceAfter = quantity;

            if (warehouseId) {
                const stock = await tx.stock.findUnique({
                    where: { productId_warehouseId: { productId, warehouseId } }
                });

                warehouseBalanceBefore = stock ? stock.quantity : 0;
                warehouseBalanceAfter = warehouseBalanceBefore + quantity;

                if (warehouseBalanceAfter < 0) {
                    throw new Error(`Insufficient stock in warehouse. Current: ${warehouseBalanceBefore}`);
                }

                await tx.stock.upsert({
                    where: { productId_warehouseId: { productId, warehouseId } },
                    update: { quantity: { increment: quantity } },
                    create: { productId, warehouseId, quantity }
                });
            } else {
                // If no warehouse specified, we rely on product global stock check
                if (product.stockQuantity + quantity < 0) {
                    throw new Error(`Insufficient global stock. Current: ${product.stockQuantity}`);
                }
            }

            // Record movement
            const movement = await tx.stockMovement.create({
                data: {
                    companyId,
                    productId,
                    warehouseId: warehouseId || null,
                    type: quantity > 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
                    quantity: Math.abs(quantity),
                    balanceBefore: warehouseId ? warehouseBalanceBefore : product.stockQuantity,
                    balanceAfter: warehouseId ? warehouseBalanceAfter : product.stockQuantity + quantity,
                    notes: reason,
                },
            });

            return { success: true, movement };
        });

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Stock adjustment error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to adjust stock" },
            { status: 500 }
        );
    }
}
