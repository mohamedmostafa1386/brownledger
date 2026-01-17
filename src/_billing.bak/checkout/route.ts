import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    createCheckoutSession,
    getOrCreateCustomer,
    createPortalSession,
    getPriceIdForPlan,
} from "@/lib/stripe";

// Create checkout session
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { planId, billingPeriod, companyId } = body;

        if (!planId || !billingPeriod) {
            return NextResponse.json(
                { error: "Plan ID and billing period are required" },
                { status: 400 }
            );
        }

        // Get price ID
        const priceId = getPriceIdForPlan(planId, billingPeriod);
        if (!priceId) {
            return NextResponse.json(
                { error: "Invalid plan or billing period" },
                { status: 400 }
            );
        }

        // Get company
        const company = await prisma.company.findUnique({
            where: { id: companyId || "demo-company" },
        });

        if (!company) {
            return NextResponse.json({ error: "Company not found" }, { status: 404 });
        }

        // Get or create Stripe customer
        const customerId = await getOrCreateCustomer(
            company.email || "user@example.com",
            company.name,
            company.id,
            company.stripeCustomerId || undefined
        );

        // Update company with Stripe customer ID if new
        if (!company.stripeCustomerId) {
            await prisma.company.update({
                where: { id: company.id },
                data: { stripeCustomerId: customerId },
            });
        }

        // Create checkout session
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const checkoutUrl = await createCheckoutSession(
            customerId,
            priceId,
            `${baseUrl}/settings/billing?success=true`,
            `${baseUrl}/settings/billing?canceled=true`,
            {
                companyId: company.id,
                planId,
                billingPeriod,
            }
        );

        return NextResponse.json({ url: checkoutUrl });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        return NextResponse.json(
            { error: "Failed to create checkout session" },
            { status: 500 }
        );
    }
}

// Get billing portal URL
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId") || "demo-company";

        const company = await prisma.company.findUnique({
            where: { id: companyId },
        });

        if (!company?.stripeCustomerId) {
            return NextResponse.json(
                { error: "No billing account found" },
                { status: 404 }
            );
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const portalUrl = await createPortalSession(
            company.stripeCustomerId,
            `${baseUrl}/settings/billing`
        );

        return NextResponse.json({ url: portalUrl });
    } catch (error) {
        console.error("Error creating portal session:", error);
        return NextResponse.json(
            { error: "Failed to create portal session" },
            { status: 500 }
        );
    }
}
