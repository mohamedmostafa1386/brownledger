"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X, Sparkles, ArrowRight, Zap } from "lucide-react";
import { PLANS } from "@/lib/plans";

export default function PricingPage() {
    const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");

    const formatPrice = (amount: number) => {
        if (amount === 0) return "Free";
        return `${amount.toLocaleString()} EGP`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-primary/20">
            {/* Header */}
            <header className="border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                            <span className="text-lg font-bold text-white">BL</span>
                        </div>
                        <span className="text-xl font-semibold text-white">BrownLedger</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-white/80 hover:text-white">
                            Login
                        </Link>
                        <Link
                            href="/auth/register"
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                            Start Free Trial
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-20">
                {/* Hero */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full text-primary mb-6">
                        <Sparkles className="w-4 h-4" />
                        Simple, transparent pricing
                    </div>
                    <h1 className="text-5xl font-bold text-white mb-4">
                        Choose the right plan for your business
                    </h1>
                    <p className="text-xl text-white/60 max-w-2xl mx-auto">
                        Start free and upgrade as you grow. All plans include core accounting features.
                    </p>
                </div>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 mb-12">
                    <button
                        onClick={() => setBillingPeriod("monthly")}
                        className={`px-4 py-2 rounded-lg transition-all ${billingPeriod === "monthly"
                            ? "bg-white text-slate-900"
                            : "text-white/60 hover:text-white"
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingPeriod("yearly")}
                        className={`px-4 py-2 rounded-lg transition-all ${billingPeriod === "yearly"
                            ? "bg-white text-slate-900"
                            : "text-white/60 hover:text-white"
                            }`}
                    >
                        Yearly
                        <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                            Save 17%
                        </span>
                    </button>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative rounded-2xl p-6 transition-all ${plan.recommended
                                ? "bg-gradient-to-b from-primary to-primary/80 text-white scale-105 shadow-2xl shadow-primary/30"
                                : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                                }`}
                        >
                            {plan.recommended && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    RECOMMENDED
                                </div>
                            )}

                            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                            <p className={`text-sm mb-6 ${plan.recommended ? "text-white/80" : "text-white/60"}`}>
                                {plan.description}
                            </p>

                            <div className="mb-6">
                                <span className="text-4xl font-bold">
                                    {formatPrice(billingPeriod === "monthly" ? plan.price.monthly : plan.price.yearly)}
                                </span>
                                {plan.price.monthly > 0 && (
                                    <span className={`text-sm ${plan.recommended ? "text-white/80" : "text-white/60"}`}>
                                        /{billingPeriod === "monthly" ? "mo" : "yr"}
                                    </span>
                                )}
                            </div>

                            <Link
                                href="/auth/register"
                                className={`block w-full py-3 text-center rounded-lg font-medium mb-6 transition-all ${plan.recommended
                                    ? "bg-white text-primary hover:bg-white/90"
                                    : "bg-primary text-white hover:bg-primary/90"
                                    }`}
                            >
                                {plan.price.monthly === 0 ? "Start Free" : "Get Started"}
                            </Link>

                            <ul className="space-y-3">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm">
                                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.recommended ? "text-white" : "text-primary"}`} />
                                        <span className={plan.recommended ? "text-white/90" : "text-white/80"}>
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Feature Comparison */}
                <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-2xl font-bold text-white">Compare Plans</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-4 text-white/60">Feature</th>
                                    {PLANS.map((plan) => (
                                        <th key={plan.id} className="p-4 text-center text-white">
                                            {plan.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                <tr>
                                    <td className="p-4 text-white/80">Users</td>
                                    {PLANS.map((plan) => (
                                        <td key={plan.id} className="p-4 text-center text-white">
                                            {plan.limits.users === -1 ? "Unlimited" : plan.limits.users}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-4 text-white/80">Invoices/month</td>
                                    {PLANS.map((plan) => (
                                        <td key={plan.id} className="p-4 text-center text-white">
                                            {plan.limits.invoicesPerMonth === -1 ? "Unlimited" : plan.limits.invoicesPerMonth}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-4 text-white/80">Clients</td>
                                    {PLANS.map((plan) => (
                                        <td key={plan.id} className="p-4 text-center text-white">
                                            {plan.limits.clients === -1 ? "Unlimited" : plan.limits.clients}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-4 text-white/80">Storage</td>
                                    {PLANS.map((plan) => (
                                        <td key={plan.id} className="p-4 text-center text-white">
                                            {plan.limits.storageGB} GB
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-4 text-white/80">AI Features</td>
                                    {PLANS.map((plan) => (
                                        <td key={plan.id} className="p-4 text-center">
                                            {plan.id === "free" || plan.id === "starter" ? (
                                                <X className="w-5 h-5 text-white/30 mx-auto" />
                                            ) : (
                                                <Check className="w-5 h-5 text-green-400 mx-auto" />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-4 text-white/80">ETA E-Invoicing</td>
                                    {PLANS.map((plan) => (
                                        <td key={plan.id} className="p-4 text-center">
                                            {plan.id === "free" || plan.id === "starter" ? (
                                                <X className="w-5 h-5 text-white/30 mx-auto" />
                                            ) : (
                                                <Check className="w-5 h-5 text-green-400 mx-auto" />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-4 text-white/80">API Access</td>
                                    {PLANS.map((plan) => (
                                        <td key={plan.id} className="p-4 text-center">
                                            {plan.id === "free" ? (
                                                <X className="w-5 h-5 text-white/30 mx-auto" />
                                            ) : (
                                                <Check className="w-5 h-5 text-green-400 mx-auto" />
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FAQ */}
                <div className="mt-20 text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Have questions?</h2>
                    <p className="text-white/60 mb-6">
                        Contact us at{" "}
                        <a href="mailto:sales@brownledger.com" className="text-primary hover:underline">
                            sales@brownledger.com
                        </a>
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 py-8">
                <div className="max-w-7xl mx-auto px-6 text-center text-white/40 text-sm">
                    © {new Date().getFullYear()} BrownLedger. All rights reserved.
                </div>
            </footer>
        </div>
    );
}
