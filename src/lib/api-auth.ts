import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
    process.env.AUTH_SECRET || "fallback-secret-for-dev-only"
);

/**
 * Get the authenticated user's company ID, role, and userId
 * Returns null if not authenticated
 */
export async function getAuthInfo(): Promise<{ companyId: string; role: string; userId: string } | null> {
    try {
        // 1. Try Session Cookie (standard web flow)
        const session = await auth();
        if (session?.user?.id) {
            const membership = await prisma.companyMembership.findFirst({
                where: { userId: session.user.id },
                select: { companyId: true, role: true, userId: true },
            });

            if (membership) {
                return {
                    companyId: membership.companyId,
                    role: membership.role,
                    userId: membership.userId,
                };
            }
        }

        // 2. Try Bearer Token (API/Test flow)
        // We need the request headers. Since Next.js doesn't provide them directly in this utility,
        // we'll use the 'headers' helper from next/headers.
        const { headers } = await import("next/headers");
        const headersList = await headers();
        const authHeader = headersList.get("authorization");

        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            try {
                const { payload } = await jwtVerify(token, JWT_SECRET);
                if (payload && payload.id && payload.companyId && payload.role) {
                    return {
                        userId: payload.id as string,
                        companyId: payload.companyId as string,
                        role: payload.role as string,
                    };
                }
            } catch (jwtError) {
                console.error("JWT verification failed:", jwtError);
            }
        }

        return null;
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
