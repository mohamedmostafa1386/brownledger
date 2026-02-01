import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authInfo = await requireAuth();
    if ("error" in authInfo) {
        return NextResponse.json({ error: authInfo.error }, { status: authInfo.status });
    }

    const { id } = await params;

    try {
        // P2025: Record to delete does not exist.
        const warehouse = await prisma.warehouse.findUnique({ where: { id } });
        if (!warehouse) {
            return NextResponse.json({ error: "Warehouse not found" }, { status: 404 });
        }

        await prisma.warehouse.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting warehouse:", error);
        return NextResponse.json({ error: "Failed to delete warehouse" }, { status: 500 });
    }
}
