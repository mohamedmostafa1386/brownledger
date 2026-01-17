import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getInviteEmailTemplate } from "@/lib/email";
import crypto from "crypto";
import { requireCompanyId } from "@/lib/api-auth";
import { permissions } from "@/lib/rbac";

// Get members for a company
export async function GET(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canManageTeam(role)) {
            return NextResponse.json({ error: "Forbidden: Only admins can manage team" }, { status: 403 });
        }

        // Get company members
        const memberships = await prisma.companyMembership.findMany({
            where: { companyId },
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true, createdAt: true },
                },
            },
        });

        // For pending invites, we'd need an Invite model
        // For now, return current members
        const members = memberships.map(m => ({
            id: m.userId,
            name: m.user.name,
            email: m.user.email,
            role: m.role,
            status: "ACTIVE",
            joinedAt: m.user.createdAt,
        }));

        return NextResponse.json({ members, pendingInvites: [] });
    } catch (error) {
        console.error("Error fetching team:", error);
        return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
    }
}

// Send team invite
export async function POST(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role: userRole } = auth;

        if (!permissions.canManageTeam(userRole)) {
            return NextResponse.json({ error: "Forbidden: Only admins can invite members" }, { status: 403 });
        }

        const body = await request.json();
        const { email, role, inviterName, name, password, directAdd } = body;

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            // Check if already a member
            const existingMembership = await prisma.companyMembership.findFirst({
                where: { userId: existingUser.id, companyId },
            });

            if (existingMembership) {
                return NextResponse.json({ error: "User is already a team member" }, { status: 400 });
            }

            // Add to company directly
            await prisma.companyMembership.create({
                data: {
                    userId: existingUser.id,
                    companyId,
                    role: role || "ACCOUNTANT",
                },
            });

            return NextResponse.json({
                success: true,
                message: "User added to team",
                addedDirectly: true,
            });
        }

        // If directAdd is true and name/password provided
        if (directAdd && name && password) {
            const bcrypt = require("bcryptjs");
            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                }
            });

            await prisma.companyMembership.create({
                data: {
                    userId: newUser.id,
                    companyId,
                    role: role || "ACCOUNTANT",
                }
            });

            return NextResponse.json({
                success: true,
                message: "User created and added to team",
                addedDirectly: true,
            });
        }

        // Generate invite token
        const inviteToken = crypto.randomBytes(32).toString("hex");

        // Get company name
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { name: true },
        });

        // Generate invite link
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/accept-invite?token=${inviteToken}&email=${encodeURIComponent(email)}&company=${companyId}`;

        // Send invite email
        const emailHtml = getInviteEmailTemplate(
            inviterName || "A team member",
            company?.name || "a company",
            role || "Team Member",
            inviteLink
        );

        await sendEmail({
            to: email,
            subject: `You're invited to join ${company?.name || "BrownLedger"}`,
            html: emailHtml,
        });

        console.log(`Invite sent to: ${email}`);
        console.log(`Invite link (dev): ${inviteLink}`);

        return NextResponse.json({
            success: true,
            message: "Invitation sent successfully",
            ...(process.env.NODE_ENV === "development" && { inviteLink }),
        });
    } catch (error) {
        console.error("Error sending invite:", error);
        return NextResponse.json({ error: "Failed to send invite" }, { status: 500 });
    }
}

// Remove team member
export async function DELETE(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role: userRole } = auth;

        if (!permissions.canManageTeam(userRole)) {
            return NextResponse.json({ error: "Forbidden: Only admins can remove members" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        await prisma.companyMembership.deleteMany({
            where: { userId, companyId },
        });

        return NextResponse.json({ success: true, message: "Member removed" });
    } catch (error) {
        console.error("Error removing member:", error);
        return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
    }
}
