import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getPasswordResetTemplate } from "@/lib/email";
import crypto from "crypto";

// Request password reset
export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({
                success: true,
                message: "If an account exists, a reset link will be sent"
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store token in database (we'll add these fields to the User model)
        // For now, store in a separate table or use existing fields
        // In production, update the User model with resetToken fields

        // Generate reset link
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        // Send email
        const emailHtml = getPasswordResetTemplate(user.name, resetLink);
        await sendEmail({
            to: email,
            subject: "Reset Your Password - BrownLedger",
            html: emailHtml,
        });

        console.log(`Password reset requested for: ${email}`);
        console.log(`Reset link (dev): ${resetLink}`);

        return NextResponse.json({
            success: true,
            message: "If an account exists, a reset link will be sent",
            // In development, include the link for testing
            ...(process.env.NODE_ENV === "development" && { resetLink }),
        });
    } catch (error) {
        console.error("Error requesting password reset:", error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}
