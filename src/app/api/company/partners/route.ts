import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";

// Get all partners
export async function GET(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const partners = await prisma.partner.findMany({
            where: { companyId, isActive: true },
            orderBy: { ownershipPercent: "desc" },
        });

        // Calculate totals
        const totalOwnership = partners.reduce((sum, p) => sum + p.ownershipPercent, 0);
        const totalCapital = partners.reduce((sum, p) => sum + p.currentCapital, 0);
        const totalDrawings = partners.reduce((sum, p) => sum + p.drawings, 0);

        return NextResponse.json({
            partners,
            summary: {
                totalOwnership,
                totalCapital,
                totalDrawings,
                netCapital: totalCapital - totalDrawings,
            },
        });
    } catch (error) {
        console.error("Error fetching partners:", error);
        return NextResponse.json({ error: "Failed to fetch partners" }, { status: 500 });
    }
}

// Add a new partner
export async function POST(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const body = await request.json();
        const {
            name,
            email,
            phone,
            ownershipPercent,
            profitSharePercent,
            capitalContribution,
        } = body;

        // Validate ownership doesn't exceed 100%
        const existingPartners = await prisma.partner.findMany({
            where: { companyId, isActive: true },
        });
        const totalExisting = existingPartners.reduce((sum, p) => sum + p.ownershipPercent, 0);

        if (totalExisting + ownershipPercent > 100) {
            return NextResponse.json(
                { error: `Total ownership would exceed 100% (current: ${totalExisting}%)` },
                { status: 400 }
            );
        }

        const partner = await prisma.partner.create({
            data: {
                companyId,
                name,
                email,
                phone,
                ownershipPercent,
                profitSharePercent: profitSharePercent || ownershipPercent,
                capitalContribution: capitalContribution || 0,
                currentCapital: capitalContribution || 0,
            },
        });

        return NextResponse.json({ success: true, partner });
    } catch (error) {
        console.error("Error creating partner:", error);
        return NextResponse.json({ error: "Failed to create partner" }, { status: 500 });
    }
}

// Update partner
export async function PATCH(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const body = await request.json();
        const { id, ...updateData } = body;

        // Verify partner belongs to this company
        const existing = await prisma.partner.findFirst({
            where: { id, companyId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Partner not found or access denied" }, { status: 404 });
        }

        const partner = await prisma.partner.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ success: true, partner });
    } catch (error) {
        console.error("Error updating partner:", error);
        return NextResponse.json({ error: "Failed to update partner" }, { status: 500 });
    }
}
