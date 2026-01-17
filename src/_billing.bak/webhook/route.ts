import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, handleWebhookEvent } from "@/lib/stripe";

export async function POST(request: NextRequest) {
    try {
        const payload = await request.text();
        const signature = request.headers.get("stripe-signature");

        if (!signature) {
            return NextResponse.json(
                { error: "Missing signature" },
                { status: 400 }
            );
        }

        const event = verifyWebhookSignature(payload, signature);

        if (!event) {
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 400 }
            );
        }

        // Process the webhook event
        await handleWebhookEvent(event);

        // Handle specific events for database updates
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as any;
                const { companyId, planId } = session.metadata || {};

                if (companyId && planId) {
                    await prisma.company.update({
                        where: { id: companyId },
                        data: {
                            subscriptionPlan: planId.toUpperCase(),
                            subscriptionStatus: "ACTIVE",
                            stripeSubscriptionId: session.subscription,
                        },
                    });
                }
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as any;
                const customerId = subscription.customer;

                const company = await prisma.company.findFirst({
                    where: { stripeCustomerId: customerId },
                });

                if (company) {
                    await prisma.company.update({
                        where: { id: company.id },
                        data: {
                            subscriptionStatus: subscription.status.toUpperCase(),
                        },
                    });
                }
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as any;
                const customerId = subscription.customer;

                const company = await prisma.company.findFirst({
                    where: { stripeCustomerId: customerId },
                });

                if (company) {
                    await prisma.company.update({
                        where: { id: company.id },
                        data: {
                            subscriptionPlan: "FREE",
                            subscriptionStatus: "CANCELED",
                            stripeSubscriptionId: null,
                        },
                    });
                }
                break;
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Webhook error:", error);
        return NextResponse.json(
            { error: "Webhook handler failed" },
            { status: 500 }
        );
    }
}
