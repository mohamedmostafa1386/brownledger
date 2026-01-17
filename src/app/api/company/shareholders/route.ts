import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";

// Get all shareholders
export async function GET(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const shareholders = await prisma.shareholder.findMany({
            where: { companyId, isActive: true },
            orderBy: { sharesOwned: "desc" },
        });

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { authorizedShares: true, parValuePerShare: true },
        });

        // Calculate totals
        const totalSharesIssued = shareholders.reduce((sum, s) => sum + s.sharesOwned, 0);
        const totalInvestment = shareholders.reduce((sum, s) => sum + s.totalInvestment, 0);

        return NextResponse.json({
            shareholders,
            summary: {
                authorizedShares: company?.authorizedShares || 0,
                issuedShares: totalSharesIssued,
                unissuedShares: (company?.authorizedShares || 0) - totalSharesIssued,
                parValuePerShare: company?.parValuePerShare || 0,
                totalParValue: totalSharesIssued * (company?.parValuePerShare || 0),
                totalInvestment,
                additionalPaidInCapital: totalInvestment - (totalSharesIssued * (company?.parValuePerShare || 0)),
            },
        });
    } catch (error) {
        console.error("Error fetching shareholders:", error);
        return NextResponse.json({ error: "Failed to fetch shareholders" }, { status: 500 });
    }
}

// Add a new shareholder (issue shares)
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
            shareClass = "COMMON",
            sharesOwned,
            sharePrice,
        } = body;

        // Validate shares don't exceed authorized
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { authorizedShares: true },
        });

        const existingShareholders = await prisma.shareholder.findMany({
            where: { companyId, isActive: true },
        });
        const totalExisting = existingShareholders.reduce((sum, s) => sum + s.sharesOwned, 0);

        if (company?.authorizedShares && totalExisting + sharesOwned > company.authorizedShares) {
            return NextResponse.json(
                { error: `Shares would exceed authorized limit (${company.authorizedShares})` },
                { status: 400 }
            );
        }

        const shareholder = await prisma.shareholder.create({
            data: {
                companyId,
                name,
                email,
                phone,
                shareClass,
                sharesOwned,
                sharePrice,
                totalInvestment: sharesOwned * sharePrice,
            },
        });

        return NextResponse.json({ success: true, shareholder });
    } catch (error) {
        console.error("Error creating shareholder:", error);
        return NextResponse.json({ error: "Failed to create shareholder" }, { status: 500 });
    }
}

// Update shareholder
export async function PATCH(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId } = auth;

        const body = await request.json();
        const { id, ...updateData } = body;

        // Verify shareholder belongs to this company
        const existing = await prisma.shareholder.findFirst({
            where: { id, companyId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Shareholder not found or access denied" }, { status: 404 });
        }

        const shareholder = await prisma.shareholder.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ success: true, shareholder });
    } catch (error) {
        console.error("Error updating shareholder:", error);
        return NextResponse.json({ error: "Failed to update shareholder" }, { status: 500 });
    }
}
