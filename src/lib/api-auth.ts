// Shared authentication helper for API routes
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Get the authenticated user's company ID, role, and userId
 * Returns null if not authenticated
 */
export async function getAuthInfo(): Promise<{ companyId: string; role: string; userId: string } | null> {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        const membership = await prisma.companyMembership.findFirst({
            where: { userId: session.user.id },
            select: { companyId: true, role: true, userId: true },
        });

        if (!membership) return null;

        return {
            companyId: membership.companyId,
            role: membership.role,
            userId: membership.userId,
        };
    } catch (error) {
        console.error("Error getting auth info:", error);
        return null;
    }
}

/**
 * Get auth info or throw/return error response
 */
export async function requireAuth(): Promise<{ companyId: string; role: string; userId: string } | { error: string; status: 401 }> {
    const authInfo = await getAuthInfo();
    if (!authInfo) {
        return { error: "Unauthorized", status: 401 };
    }
    return authInfo;
}

// Deprecated old helpers to maintain compatibility during migration
export async function requireCompanyId(): Promise<{ companyId: string; role: string } | { error: string; status: 401 }> {
    const info = await getAuthInfo();
    if (!info) return { error: "Unauthorized", status: 401 };
    return { companyId: info.companyId, role: info.role };
}

export async function getCompanyIdAndRole(): Promise<{ companyId: string; role: string } | null> {
    const info = await getAuthInfo();
    return info ? { companyId: info.companyId, role: info.role } : null;
}

// Deprecated old helper to maintain compatibility during migration
export async function getCompanyId(): Promise<string | null> {
    const info = await getCompanyIdAndRole();
    return info ? info.companyId : null;
}
