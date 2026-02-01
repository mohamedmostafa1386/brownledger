import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";
import { apiResponse, apiError } from "@/lib/api-response";

const JWT_SECRET = new TextEncoder().encode(
    process.env.AUTH_SECRET || "fallback-secret-for-dev-only"
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return apiError("Email and password are required", "MISSING_CREDENTIALS", 400);
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                memberships: true,
            },
        });

        if (!user) {
            return apiError("Invalid credentials", "INVALID_CREDENTIALS", 401);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return apiError("Invalid credentials", "INVALID_CREDENTIALS", 401);
        }

        // Get the first company membership
        const membership = user.memberships[0];
        if (!membership) {
            return apiError("User has no company membership", "NO_MEMBERSHIP", 403);
        }

        // Create JWT token
        const token = await new SignJWT({
            id: user.id,
            email: user.email,
            role: membership.role,
            companyId: membership.companyId,
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("24h")
            .sign(JWT_SECRET);

        return apiResponse({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: membership.role,
                companyId: membership.companyId,
            },
        });
    } catch (error) {
        console.error("Login API error details:", error);
        return apiError("Internal server error", "SERVER_ERROR", 500, error instanceof Error ? error.message : String(error));
    }
}
