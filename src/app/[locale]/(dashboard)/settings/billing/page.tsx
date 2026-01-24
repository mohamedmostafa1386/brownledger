"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PLANS } from "@/lib/plans";
import {
    CreditCard,
    Check,
    Crown,
    Zap,
    AlertCircle,
    ExternalLink,
    CheckCircle,
} from "lucide-react";

export default function BillingPage() {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Check for success/cancel from Stripe
    useEffect(() => {
        if (searchParams.get("success")) {
            setMessage({ type: "success", text: "Subscription activated successfully!" });
        } else if (searchParams.get("canceled")) {
            setMessage({ type: "error", text: "Checkout was canceled." });
        }
    }, [searchParams]);

    // Fetch current subscription
    const { data: subscription } = useQuery({
        queryKey: ["subscription"],
        queryFn: () => fetch("/api/company/settings").then(r => r.json()),
    });

    const currentPlan = subscription?.subscriptionPlan?.toLowerCase() || "free";

    const handleUpgrade = async (planId: string, billingPeriod: "monthly" | "yearly") => {
        setLoading(planId);
        try {
            const response = await fetch("/api/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId, billingPeriod }),
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                setMessage({ type: "error", text: data.error || "Failed to start checkout" });
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to start checkout" });
        } finally {
            setLoading(null);
        }
    };

    const handleManageBilling = async () => {
        setLoading("portal");
        try {
            const response = await fetch("/api/billing/checkout");
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to open billing portal" });
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Billing & Subscription</h1>
                    <p className="text-muted-foreground">Manage your subscription plan</p>
                </div>
                {currentPlan !== "free" && (
                    <button
                        onClick={handleManageBilling}
                        disabled={loading === "portal"}
                        className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted"
                    >
                        <ExternalLink className="w-4 h-4" />
                        {loading === "portal" ? "Loading..." : "Manage Billing"}
                    </button>
                )}
            </div>

            {/* Messages */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === "success"
                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                        : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                    }`}>
                    {message.type === "success" ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    {message.text}
                </div>
            )}

            {/* Current Plan */}
            <div className="bg-gradient-to-r from-primary to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <Crown className="w-8 h-8" />
                    <div>
                        <p className="text-white/80 text-sm">Current Plan</p>
                        <h2 className="text-2xl font-bold capitalize">{currentPlan}</h2>
                    </div>
                </div>
                <p className="text-white/80">
                    {currentPlan === "free"
                        ? "Upgrade to unlock more features and higher limits."
                        : "You have access to all features in this plan."}
                </p>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {PLANS.map((plan) => {
                    const isCurrent = plan.id === currentPlan;
                    const isUpgrade = PLANS.findIndex(p => p.id === plan.id) > PLANS.findIndex(p => p.id === currentPlan);

                    return (
                        <div
                            key={plan.id}
                            className={`rounded-xl border p-6 ${plan.recommended
                                    ? "border-primary bg-primary/5"
                                    : "border-border"
                                } ${isCurrent ? "ring-2 ring-primary" : ""}`}
                        >
                            {plan.recommended && (
                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary text-white text-xs rounded-full mb-4">
                                    <Zap className="w-3 h-3" />
                                    Recommended
                                </div>
                            )}

                            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>

                            <div className="mb-4">
                                <span className="text-3xl font-bold">
                                    {plan.price.monthly === 0 ? "Free" : `${plan.price.monthly} EGP`}
                                </span>
                                {plan.price.monthly > 0 && (
                                    <span className="text-muted-foreground">/mo</span>
                                )}
                            </div>

                            <ul className="space-y-2 mb-6">
                                {plan.features.slice(0, 4).map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                        <Check className="w-4 h-4 text-green-500 mt-0.5" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {isCurrent ? (
                                <div className="w-full py-2 text-center bg-muted rounded-lg text-sm font-medium">
                                    Current Plan
                                </div>
                            ) : isUpgrade ? (
                                <button
                                    onClick={() => handleUpgrade(plan.id, "monthly")}
                                    disabled={loading === plan.id}
                                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {loading === plan.id ? "Loading..." : "Upgrade"}
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="w-full py-2 border border-border rounded-lg text-sm text-muted-foreground"
                                >
                                    Downgrade via Portal
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Features */}
            <div className="bg-card rounded-lg border border-border p-6">
                <h3 className="font-semibold mb-4">Need help choosing?</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="font-medium text-green-600">Free</p>
                        <p className="text-muted-foreground">Perfect for trying out BrownLedger</p>
                    </div>
                    <div>
                        <p className="font-medium text-blue-600">Starter</p>
                        <p className="text-muted-foreground">For small businesses and freelancers</p>
                    </div>
                    <div>
                        <p className="font-medium text-purple-600">Professional</p>
                        <p className="text-muted-foreground">For growing businesses with team</p>
                    </div>
                    <div>
                        <p className="font-medium text-orange-600">Enterprise</p>
                        <p className="text-muted-foreground">For large organizations</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
