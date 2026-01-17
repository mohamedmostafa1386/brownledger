import Stripe from "stripe";
import { PLANS, getPlan } from "./plans";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2023-10-16",
});

// Stripe Product/Price IDs (set up in Stripe Dashboard)
export const STRIPE_PRICE_IDS = {
    starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || "price_starter_monthly",
    starter_yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || "price_starter_yearly",
    professional_monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || "price_pro_monthly",
    professional_yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY || "price_pro_yearly",
    enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || "price_enterprise_monthly",
    enterprise_yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || "price_enterprise_yearly",
};

// Create checkout session for subscription
export async function createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, string>
): Promise<string> {
    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        allow_promotion_codes: true,
        billing_address_collection: "required",
    });

    return session.url || "";
}

// Create Stripe customer
export async function createCustomer(
    email: string,
    name: string,
    companyId: string
): Promise<string> {
    const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
            companyId,
        },
    });

    return customer.id;
}

// Get or create customer
export async function getOrCreateCustomer(
    email: string,
    name: string,
    companyId: string,
    existingCustomerId?: string
): Promise<string> {
    if (existingCustomerId) {
        try {
            await stripe.customers.retrieve(existingCustomerId);
            return existingCustomerId;
        } catch {
            // Customer doesn't exist, create new one
        }
    }

    // Check if customer exists by email
    const customers = await stripe.customers.list({
        email,
        limit: 1,
    });

    if (customers.data.length > 0) {
        return customers.data[0].id;
    }

    return createCustomer(email, name, companyId);
}

// Get subscription status
export async function getSubscription(subscriptionId: string) {
    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        return {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            planId: subscription.items.data[0]?.price.id,
        };
    } catch {
        return null;
    }
}

// Cancel subscription
export async function cancelSubscription(
    subscriptionId: string,
    immediately: boolean = false
): Promise<boolean> {
    try {
        if (immediately) {
            await stripe.subscriptions.cancel(subscriptionId);
        } else {
            await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true,
            });
        }
        return true;
    } catch {
        return false;
    }
}

// Create customer portal session
export async function createPortalSession(
    customerId: string,
    returnUrl: string
): Promise<string> {
    const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
    });

    return session.url;
}

// Verify webhook signature
export function verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
): Stripe.Event | null {
    try {
        return stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ""
        );
    } catch {
        return null;
    }
}

// Handle webhook events
export async function handleWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log(`Checkout completed: ${session.id}`);
            // Update company subscription in database
            break;
        }

        case "customer.subscription.created":
        case "customer.subscription.updated": {
            const subscription = event.data.object as Stripe.Subscription;
            console.log(`Subscription ${event.type}: ${subscription.id}`);
            // Update company subscription status in database
            break;
        }

        case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            console.log(`Subscription cancelled: ${subscription.id}`);
            // Downgrade company to free plan
            break;
        }

        case "invoice.payment_succeeded": {
            const invoice = event.data.object as Stripe.Invoice;
            console.log(`Payment succeeded: ${invoice.id}`);
            // Send receipt email
            break;
        }

        case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            console.log(`Payment failed: ${invoice.id}`);
            // Send payment failed email
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
}

// Get price ID for plan
export function getPriceIdForPlan(
    planId: string,
    billingPeriod: "monthly" | "yearly"
): string | null {
    const key = `${planId}_${billingPeriod}` as keyof typeof STRIPE_PRICE_IDS;
    return STRIPE_PRICE_IDS[key] || null;
}

export { stripe };
