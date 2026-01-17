import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCompanyId } from "@/lib/api-auth";
import { permissions } from "@/lib/rbac";

// Get company settings
export async function GET(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canManageCompany(role)) {
            return NextResponse.json({ error: "Forbidden: Only admins can access settings" }, { status: 403 });
        }

        const company = await prisma.company.findUnique({
            where: { id: companyId },
            include: {
                partners: true,
                shareholders: true,
            },
        });

        if (!company) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }

        // Get equity template based on company type
        const equityTemplate = getEquityTemplate(company.companyType);

        return NextResponse.json({
            company: {
                id: company.id,
                name: company.name,
                companyType: company.companyType,
                authorizedShares: company.authorizedShares,
                parValuePerShare: company.parValuePerShare,
                currency: company.currency,
            },
            equityTemplate,
            partners: company.partners,
            shareholders: company.shareholders,
        });
    } catch (error) {
        console.error("Error fetching company settings:", error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

// Update company settings
export async function PATCH(request: NextRequest) {
    try {
        const auth = await requireCompanyId();
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }
        const { companyId, role } = auth;

        if (!permissions.canManageCompany(role)) {
            return NextResponse.json({ error: "Forbidden: Only admins can update settings" }, { status: 403 });
        }

        const body = await request.json();
        const { companyType, authorizedShares, parValuePerShare } = body;

        const company = await prisma.company.update({
            where: { id: companyId },
            data: {
                companyType,
                authorizedShares,
                parValuePerShare,
            },
        });

        return NextResponse.json({ success: true, company });
    } catch (error) {
        console.error("Error updating company settings:", error);
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}

// Get equity account template based on company type
function getEquityTemplate(companyType: string) {
    switch (companyType) {
        case "SOLE_PROPRIETORSHIP":
            return {
                name: "Owner's Equity",
                accounts: [
                    { code: "3000", name: "Owner's Capital", description: "Initial and additional capital contributions" },
                    { code: "3100", name: "Owner's Drawings", description: "Owner withdrawals (contra-equity)" },
                    { code: "3200", name: "Retained Earnings", description: "Accumulated profits" },
                ],
            };

        case "PARTNERSHIP":
            return {
                name: "Partners' Equity",
                accounts: [
                    { code: "3000", name: "Partner Capital - Partner A", description: "Capital account for Partner A" },
                    { code: "3010", name: "Partner Capital - Partner B", description: "Capital account for Partner B" },
                    { code: "3100", name: "Partner Drawings - Partner A", description: "Drawings for Partner A" },
                    { code: "3110", name: "Partner Drawings - Partner B", description: "Drawings for Partner B" },
                    { code: "3200", name: "Retained Earnings", description: "Undistributed profits" },
                ],
                notes: [
                    "Each partner has separate capital and drawings accounts",
                    "Profit/Loss is allocated based on partnership agreement percentages",
                ],
            };

        case "LLC":
            return {
                name: "Members' Equity",
                accounts: [
                    { code: "3000", name: "Member Capital", description: "Total member contributions" },
                    { code: "3100", name: "Member Drawings", description: "Member distributions" },
                    { code: "3200", name: "Retained Earnings", description: "Accumulated profits" },
                ],
                notes: [
                    "LLC can be taxed as sole proprietorship, partnership, or corporation",
                    "Distribution follows operating agreement",
                ],
            };

        case "CORPORATION":
            return {
                name: "Shareholders' Equity",
                accounts: [
                    { code: "3000", name: "Common Stock", description: "Par value of issued common shares" },
                    { code: "3010", name: "Preferred Stock", description: "Par value of issued preferred shares" },
                    { code: "3100", name: "Additional Paid-in Capital", description: "Amount received above par value" },
                    { code: "3200", name: "Retained Earnings", description: "Accumulated undistributed profits" },
                    { code: "3300", name: "Treasury Stock", description: "Repurchased shares (contra-equity)" },
                    { code: "3400", name: "Dividends Declared", description: "Dividends payable to shareholders" },
                ],
                notes: [
                    "Stock issuance is tracked by share class",
                    "Dividends require board declaration",
                    "Retained Earnings affected by net income and dividends",
                ],
            };

        default:
            return {
                name: "Equity",
                accounts: [
                    { code: "3000", name: "Capital", description: "Owner's capital" },
                    { code: "3200", name: "Retained Earnings", description: "Accumulated profits" },
                ],
            };
    }
}
