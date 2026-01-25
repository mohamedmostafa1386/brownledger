"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import {
    Sparkles,
    Send,
    Building2,
    CheckCircle,
    Loader2,
    ArrowRight,
    Factory,
    ShoppingBag,
    Briefcase,
    HardHat,
    Stethoscope,
    UtensilsCrossed,
    MoreHorizontal,
} from "lucide-react";

interface Analysis {
    industry: string;
    companyType: string;
    suggestedName?: string;
    currency: string;
    vatRate: number;
    language: string;
    customCategories?: {
        clients: string[];
        expenses: string[];
        products: string[];
    };
    templateCategories?: {
        clientCategories: { name: string; nameAr?: string }[];
        expenseCategories: string[];
        productCategories: string[];
    };
    recommendations: string[];
    questions: string[];
}

const INDUSTRY_ICONS: Record<string, JSX.Element> = {
    manufacturing: <Factory className="w-6 h-6" />,
    retail: <ShoppingBag className="w-6 h-6" />,
    services: <Briefcase className="w-6 h-6" />,
    construction: <HardHat className="w-6 h-6" />,
    healthcare: <Stethoscope className="w-6 h-6" />,
    restaurant: <UtensilsCrossed className="w-6 h-6" />,
    other: <MoreHorizontal className="w-6 h-6" />,
};

export default function AIOnboardingPage() {
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;
    const [step, setStep] = useState<"describe" | "review" | "applying" | "complete">("describe");
    const [description, setDescription] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [error, setError] = useState("");

    const handleAnalyze = async () => {
        if (!description.trim()) return;

        setIsAnalyzing(true);
        setError("");

        try {
            const res = await fetch("/api/onboarding/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description, step: "analyze" }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to analyze");
            }

            setAnalysis(data.analysis);
            setStep("review");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleApply = async () => {
        if (!analysis) return;

        setStep("applying");

        try {
            const res = await fetch("/api/onboarding/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    step: "apply",
                    companyId: "demo-company", // In production, get from session
                    analysis,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to apply");
            }

            setStep("complete");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to apply customizations");
            setStep("review");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                        <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">AI-Powered Setup</h1>
                    <p className="text-muted-foreground">
                        Tell us about your business and we&apos;ll customize BrownLedger for you
                    </p>
                </div>

                <div className="bg-card border rounded-2xl shadow-xl overflow-hidden">
                    <AnimatePresence mode="wait">
                        {/* Step 1: Describe Business */}
                        {step === "describe" && (
                            <motion.div
                                key="describe"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-6"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                                        1
                                    </div>
                                    <h2 className="text-xl font-semibold">Describe Your Business</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-muted/50 rounded-xl p-4">
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Tell our AI about your business. Include details like:
                                        </p>
                                        <ul className="text-sm space-y-1 text-muted-foreground">
                                            <li>• What industry are you in?</li>
                                            <li>• What products or services do you offer?</li>
                                            <li>• Who are your typical customers?</li>
                                            <li>• What are your main business expenses?</li>
                                            <li>• Any specific accounting needs?</li>
                                        </ul>
                                    </div>

                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Example: We are a metalwork manufacturing company based in Cairo, Egypt. We produce custom metal gates, railings, and decorative items for residential and commercial clients. Our main expenses are raw materials (steel, iron), equipment maintenance, and labor. We have about 20 employees and deal with both individual customers and construction companies..."
                                        className="w-full h-48 p-4 rounded-xl border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                    />

                                    {error && (
                                        <p className="text-sm text-destructive">{error}</p>
                                    )}

                                    <button
                                        onClick={handleAnalyze}
                                        disabled={!description.trim() || isAnalyzing}
                                        className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Analyzing with AI...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                Analyze & Customize
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Review Recommendations */}
                        {step === "review" && analysis && (
                            <motion.div
                                key="review"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-6"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                                        2
                                    </div>
                                    <h2 className="text-xl font-semibold">Review AI Recommendations</h2>
                                </div>

                                <div className="space-y-6">
                                    {/* Detected Industry */}
                                    <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
                                        <div className="p-3 bg-primary/10 rounded-lg text-primary">
                                            {INDUSTRY_ICONS[analysis.industry] || <Building2 className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Detected Industry</p>
                                            <p className="font-semibold capitalize">{analysis.industry}</p>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <p className="text-sm text-muted-foreground">Currency</p>
                                            <p className="font-semibold">{analysis.currency}</p>
                                        </div>
                                    </div>

                                    {/* Categories to Create */}
                                    <div className="space-y-4">
                                        <h3 className="font-medium">Categories to Create</h3>

                                        <div className="grid gap-3">
                                            <div className="p-3 bg-muted/50 rounded-lg">
                                                <p className="text-sm text-muted-foreground mb-2">Client Categories</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(analysis.templateCategories?.clientCategories || []).map((cat, i) => (
                                                        <span key={i} className="px-2 py-1 bg-background rounded text-sm">
                                                            {typeof cat === "object" ? cat.name : cat}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-3 bg-muted/50 rounded-lg">
                                                <p className="text-sm text-muted-foreground mb-2">Expense Categories</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(analysis.templateCategories?.expenseCategories || []).map((cat, i) => (
                                                        <span key={i} className="px-2 py-1 bg-background rounded text-sm">
                                                            {cat}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-3 bg-muted/50 rounded-lg">
                                                <p className="text-sm text-muted-foreground mb-2">Product Categories</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {(analysis.templateCategories?.productCategories || []).map((cat, i) => (
                                                        <span key={i} className="px-2 py-1 bg-background rounded text-sm">
                                                            {cat}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recommendations */}
                                    {analysis.recommendations?.length > 0 && (
                                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                                                AI Recommendations
                                            </p>
                                            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                                                {analysis.recommendations.map((rec, i) => (
                                                    <li key={i}>• {rec}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setStep("describe")}
                                            className="flex-1 h-12 rounded-xl border font-medium hover:bg-muted transition"
                                        >
                                            Go Back
                                        </button>
                                        <button
                                            onClick={handleApply}
                                            className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
                                        >
                                            Apply Customizations
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 3: Applying */}
                        {step === "applying" && (
                            <motion.div
                                key="applying"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-12 text-center"
                            >
                                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                                <h2 className="text-xl font-semibold mb-2">Setting Up Your Account</h2>
                                <p className="text-muted-foreground">
                                    Creating categories and customizing your instance...
                                </p>
                            </motion.div>
                        )}

                        {/* Step 4: Complete */}
                        {step === "complete" && (
                            <motion.div
                                key="complete"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-12 text-center"
                            >
                                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Setup Complete!</h2>
                                <p className="text-muted-foreground mb-6">
                                    Your BrownLedger instance has been customized for your business.
                                </p>
                                <button
                                    onClick={() => router.push(`/${locale}/dashboard`)}
                                    className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
                                >
                                    Go to Dashboard
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Progress Indicator */}
                <div className="flex justify-center gap-2 mt-6">
                    {["describe", "review", "complete"].map((s, i) => (
                        <div
                            key={s}
                            className={`w-2 h-2 rounded-full transition ${step === s || (step === "applying" && s === "review")
                                ? "bg-primary"
                                : "bg-muted"
                                }`}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
