
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
        const { productId, fromWarehouse, toWarehouse, quantity } = body;

        if (!productId || !fromWarehouse || !toWarehouse || !quantity || quantity <= 0) {
            return NextResponse.json({ error: "Missing required fields or invalid quantity" }, { status: 400 });
        }

        if (fromWarehouse === toWarehouse) {
            return NextResponse.json({ error: "Cannot transfer to same warehouse" }, { status: 400 });
        }

        // Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Check source stock
            const sourceStock = await tx.stock.findUnique({
                where: {
                    productId_warehouseId: {
                        productId,
                        warehouseId: fromWarehouse
                    }
                }
            });

            if (!sourceStock || sourceStock.quantity < quantity) {
                // Determine available
                const available = sourceStock ? sourceStock.quantity : 0;
                throw new Error(`Insufficient stock in source warehouse. Available: ${available}`);
            }

            // Decrement source
            await tx.stock.update({
                where: {
                    productId_warehouseId: {
                        productId,
                        warehouseId: fromWarehouse
                    }
                },
                data: {
                    quantity: { decrement: quantity }
                }
            });

            // Increment dest
            await tx.stock.upsert({
                where: {
                    productId_warehouseId: {
                        productId,
                        warehouseId: toWarehouse
                    }
                },
                update: {
                    quantity: { increment: quantity }
                },
                create: {
                    productId,
                    warehouseId: toWarehouse,
                    quantity
                }
            });

            // Record Movement OUT
            await tx.stockMovement.create({
                data: {
                    companyId,
                    productId,
                    warehouseId: fromWarehouse,
                    type: "TRANSFER_OUT",
                    quantity: quantity, // Maybe store as negative? Or just type handles it. Usually Abs value.
                    // But balance calculation relies on logic. Let's start with positive quantity + type.
                    balanceBefore: sourceStock.quantity,
                    balanceAfter: sourceStock.quantity - quantity,
                    notes: `Transfer to warehouse ${toWarehouse}`,
                }
            });

            // Record Movement IN
            // We need new balance for dest...
            const destStock = await tx.stock.findUnique({
                where: { productId_warehouseId: { productId, warehouseId: toWarehouse } }
            });
            const destBalance = destStock!.quantity;

            await tx.stockMovement.create({
                data: {
                    companyId,
                    productId,
                    warehouseId: toWarehouse,
                    type: "TRANSFER_IN",
                    quantity: quantity,
                    balanceBefore: destBalance - quantity, // approximate
                    balanceAfter: destBalance,
                    notes: `Transfer from warehouse ${fromWarehouse}`,
                }
            });

            return { success: true };
        });

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Stock transfer error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to transfer stock" },
            { status: 500 }
        );
    }
}
