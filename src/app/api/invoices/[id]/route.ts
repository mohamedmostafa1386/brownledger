import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

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
        const invoice = await prisma.invoice.findUnique({
            where: {
                id,
                companyId: authInfo.companyId,
            },
            include: {
                items: true,
                client: {
                    select: {
                        name: true,
                        email: true,
                        address: true,
                    }
                }
            },
        });

        if (!invoice) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        return NextResponse.json(invoice);
    } catch (error) {
        console.error("Error fetching invoice:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
