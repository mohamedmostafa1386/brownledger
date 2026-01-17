// Subscription Plans Configuration
// Defines the available plans and their features

export interface Plan {
    id: string;
    name: string;
    nameAr: string;
    description: string;
    price: {
        monthly: number;
        yearly: number;
        currency: string;
    };
    features: string[];
    limits: {
        users: number;
        invoicesPerMonth: number;
        clients: number;
        products: number;
        bankAccounts: number;
        storageGB: number;
        apiCalls: number;
    };
    recommended?: boolean;
}

export const PLANS: Plan[] = [
    {
        id: "free",
        name: "Free",
        nameAr: "مجاني",
        description: "Perfect for freelancers and small businesses just getting started",
        price: {
            monthly: 0,
            yearly: 0,
            currency: "EGP",
        },
        features: [
            "Up to 5 invoices/month",
            "1 user",
            "10 clients",
            "Basic reports",
            "Email support",
        ],
        limits: {
            users: 1,
            invoicesPerMonth: 5,
            clients: 10,
            products: 20,
            bankAccounts: 1,
            storageGB: 1,
            apiCalls: 100,
        },
    },
    {
        id: "starter",
        name: "Starter",
        nameAr: "مبتدئ",
        description: "For growing businesses that need more capacity",
        price: {
            monthly: 199,
            yearly: 1990, // ~2 months free
            currency: "EGP",
        },
        features: [
            "Up to 50 invoices/month",
            "3 users",
            "100 clients",
            "Full financial reports",
            "Bank reconciliation",
            "Invoice PDF export",
            "Priority email support",
        ],
        limits: {
            users: 3,
            invoicesPerMonth: 50,
            clients: 100,
            products: 100,
            bankAccounts: 3,
            storageGB: 5,
            apiCalls: 1000,
        },
    },
    {
        id: "professional",
        name: "Professional",
        nameAr: "احترافي",
        description: "Advanced features for established businesses",
        price: {
            monthly: 499,
            yearly: 4990, // ~2 months free
            currency: "EGP",
        },
        features: [
            "Unlimited invoices",
            "10 users",
            "Unlimited clients",
            "Advanced analytics",
            "AI-powered insights",
            "ETA e-invoicing",
            "VAT reports",
            "API access",
            "Phone support",
        ],
        limits: {
            users: 10,
            invoicesPerMonth: -1, // unlimited
            clients: -1, // unlimited
            products: 500,
            bankAccounts: 10,
            storageGB: 20,
            apiCalls: 10000,
        },
        recommended: true,
    },
    {
        id: "enterprise",
        name: "Enterprise",
        nameAr: "مؤسسات",
        description: "Custom solutions for large organizations",
        price: {
            monthly: 999,
            yearly: 9990, // ~2 months free
            currency: "EGP",
        },
        features: [
            "Everything in Professional",
            "Unlimited users",
            "Custom integrations",
            "Dedicated support",
            "SLA guarantee",
            "On-premise option",
            "Custom training",
            "White-label option",
        ],
        limits: {
            users: -1, // unlimited
            invoicesPerMonth: -1,
            clients: -1,
            products: -1,
            bankAccounts: -1,
            storageGB: 100,
            apiCalls: -1,
        },
    },
];

// Get plan by ID
export function getPlan(planId: string): Plan | undefined {
    return PLANS.find(p => p.id === planId);
}

// Check if a feature is available for a plan
export function hasFeature(planId: string, feature: string): boolean {
    const plan = getPlan(planId);
    return plan?.features.some(f => f.toLowerCase().includes(feature.toLowerCase())) || false;
}

// Check if within limits
export function isWithinLimits(
    planId: string,
    limitType: keyof Plan["limits"],
    currentUsage: number
): boolean {
    const plan = getPlan(planId);
    if (!plan) return false;
    const limit = plan.limits[limitType];
    return limit === -1 || currentUsage < limit; // -1 means unlimited
}

// Get usage percentage
export function getUsagePercentage(
    planId: string,
    limitType: keyof Plan["limits"],
    currentUsage: number
): number {
    const plan = getPlan(planId);
    if (!plan) return 0;
    const limit = plan.limits[limitType];
    if (limit === -1) return 0; // unlimited
    return Math.min(100, Math.round((currentUsage / limit) * 100));
}
