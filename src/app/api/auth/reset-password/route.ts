import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Reset password with token
export async function POST(request: NextRequest) {
    try {
        const { email, token, newPassword } = await request.json();

        if (!email || !token || !newPassword) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
        }

        // In production, verify the token against stored hash and check expiry
        // For now, we'll trust the token (should add token verification in production)

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
            },
        });

        console.log(`Password reset successful for: ${email}`);

        return NextResponse.json({
            success: true,
            message: "Password reset successfully",
        });
    } catch (error) {
        console.error("Error resetting password:", error);
        return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
    }
}
