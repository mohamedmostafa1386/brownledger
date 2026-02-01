import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { permissions } from "@/lib/rbac";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authInfo = await requireAuth();
    if ("error" in authInfo) {
        return NextResponse.json({ error: authInfo.error }, { status: authInfo.status });
    }
    const { companyId, role: userRole } = authInfo;

    if (!permissions.canManageTeam(userRole)) {
        return NextResponse.json({ error: "Forbidden: Only admins can remove members" }, { status: 403 });
    }

    const { id } = await params;

    try {
        const membership = await prisma.companyMembership.findFirst({
            where: { userId: id, companyId },
        });

        if (!membership) {
            return NextResponse.json({ error: "Team member not found" }, { status: 404 });
        }

        await prisma.companyMembership.deleteMany({
            where: { userId: id, companyId },
        });

        return NextResponse.json({ success: true, message: "Member removed" });
    } catch (error) {
        console.error("Error removing member:", error);
        return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
    }
}
