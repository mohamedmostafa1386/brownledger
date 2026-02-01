import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// GET /api/clients/[id]
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authInfo = await requireAuth();
    if ("error" in authInfo) {
        return NextResponse.json({ error: authInfo.error }, { status: authInfo.status });
    }

    const { id } = await params;

    try {
        const client = await prisma.client.findUnique({
            where: { id, companyId: authInfo.companyId },
        });

        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        return NextResponse.json(client);
    } catch (error) {
        console.error("Error fetching client:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/clients/[id]
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
        const client = await prisma.client.findUnique({
            where: { id, companyId: authInfo.companyId },
        });

        if (!client) {
            return NextResponse.json({ error: "Client not found" }, { status: 404 });
        }

        await prisma.client.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting client:", error);
        return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
    }
}
