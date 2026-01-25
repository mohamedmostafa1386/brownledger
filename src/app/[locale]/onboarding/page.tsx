"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import {
    Building2,
    Users,
    UserCircle,
    ArrowRight,
    ArrowLeft,
    Check,
    ChevronRight,
    Sparkles,
    FileSpreadsheet,
    Calendar,
} from "lucide-react";

type CompanyType = "SOLE_PROPRIETORSHIP" | "PARTNERSHIP" | "LLC" | "CORPORATION";

interface WizardStep {
    id: number;
    title: string;
    description: string;
    icon: any;
}

const steps: WizardStep[] = [
    { id: 1, title: "Company Information", description: "Basic company details", icon: Building2 },
    { id: 2, title: "Company Type", description: "Choose your business structure", icon: Users },
    { id: 3, title: "Chart of Accounts", description: "Set up your accounts", icon: FileSpreadsheet },
    { id: 4, title: "Fiscal Year", description: "Define your accounting period", icon: Calendar },
];

export default function OnboardingPage() {
    const { t, locale } = useI18n();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        companyName: "",
        taxId: "",
        address: "",
        phone: "",
        currency: "EGP",
        companyType: "LLC" as CompanyType,
        fiscalYearStart: 1,
        createDefaultAccounts: true,
    });

    const companyTypes = [
        { value: "SOLE_PROPRIETORSHIP", label: "Sole Proprietorship", icon: UserCircle, description: "Single owner business" },
        { value: "PARTNERSHIP", label: "Partnership", icon: Users, description: "Multiple partners" },
        { value: "LLC", label: "LLC", icon: Building2, description: "Limited Liability" },
        { value: "CORPORATION", label: "Corporation", icon: Building2, description: "Stock company" },
    ];

    const currencies = [
        { code: "EGP", name: "Egyptian Pound", symbol: "£" },
        { code: "USD", name: "US Dollar", symbol: "$" },
        { code: "EUR", name: "Euro", symbol: "€" },
        { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
        { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
    ];

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Create company
            const response = await fetch("/api/company", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                router.push(`/${locale}/dashboard`);
            }
        } catch (error) {
            console.error("Error creating company:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const StepIndicator = () => (
        <div className="flex items-center justify-center mb-8">
            {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                    <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${currentStep >= step.id
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-border text-muted-foreground"
                            }`}
                    >
                        {currentStep > step.id ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <span className="text-sm font-semibold">{step.id}</span>
                        )}
                    </div>
                    {index < steps.length - 1 && (
                        <div
                            className={`w-16 h-0.5 mx-2 transition-all ${currentStep > step.id ? "bg-primary" : "bg-border"
                                }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-primary-foreground" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Welcome to BrownLedger</h1>
                    <p className="text-muted-foreground">Let's set up your company in just a few steps</p>
                </div>

                {/* Step Indicator */}
                <StepIndicator />

                {/* Step Content */}
                <div className="bg-card rounded-2xl border border-border p-8 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        {(() => {
                            const StepIcon = steps[currentStep - 1].icon;
                            return <StepIcon className="w-6 h-6 text-primary" />;
                        })()}
                        <div>
                            <h2 className="text-xl font-semibold">{steps[currentStep - 1].title}</h2>
                            <p className="text-sm text-muted-foreground">{steps[currentStep - 1].description}</p>
                        </div>
                    </div>

                    {/* Step 1: Company Information */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Company Name *</label>
                                <input
                                    type="text"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    placeholder="Enter your company name"
                                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Tax ID / CR Number</label>
                                    <input
                                        type="text"
                                        value={formData.taxId}
                                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                                        placeholder="Optional"
                                        className="w-full px-4 py-3 rounded-lg border border-border bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+20 xxx xxx xxxx"
                                        className="w-full px-4 py-3 rounded-lg border border-border bg-background"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Enter your business address"
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-lg border border-border bg-background resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Currency</label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg border border-border bg-background"
                                >
                                    {currencies.map((c) => (
                                        <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Company Type */}
                    {currentStep === 2 && (
                        <div className="grid grid-cols-2 gap-4">
                            {companyTypes.map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => setFormData({ ...formData, companyType: type.value as CompanyType })}
                                    className={`p-5 rounded-xl border-2 text-left transition-all ${formData.companyType === type.value
                                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                        : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    <type.icon className={`w-10 h-10 mb-3 ${formData.companyType === type.value ? "text-primary" : "text-muted-foreground"}`} />
                                    <h3 className="font-semibold text-lg">{type.label}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                                    {formData.companyType === type.value && (
                                        <div className="mt-3 flex items-center gap-1 text-primary text-sm">
                                            <Check className="w-4 h-4" />
                                            Selected
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Step 3: Chart of Accounts */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div className="bg-muted/50 rounded-xl p-5">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.createDefaultAccounts}
                                        onChange={(e) => setFormData({ ...formData, createDefaultAccounts: e.target.checked })}
                                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
                                    />
                                    <div>
                                        <span className="font-medium">Create default chart of accounts</span>
                                        <p className="text-sm text-muted-foreground">
                                            We'll create a standard IFRS-compliant chart of accounts for you
                                        </p>
                                    </div>
                                </label>
                            </div>

                            {formData.createDefaultAccounts && (
                                <div className="space-y-3">
                                    <h3 className="font-medium text-sm text-muted-foreground">Preview of accounts to be created:</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-center gap-2 p-2 rounded bg-blue-500/10 text-blue-600">
                                            <ChevronRight className="w-4 h-4" /> Cash & Bank Accounts
                                        </div>
                                        <div className="flex items-center gap-2 p-2 rounded bg-blue-500/10 text-blue-600">
                                            <ChevronRight className="w-4 h-4" /> Accounts Receivable
                                        </div>
                                        <div className="flex items-center gap-2 p-2 rounded bg-blue-500/10 text-blue-600">
                                            <ChevronRight className="w-4 h-4" /> Inventory
                                        </div>
                                        <div className="flex items-center gap-2 p-2 rounded bg-purple-500/10 text-purple-600">
                                            <ChevronRight className="w-4 h-4" /> Fixed Assets
                                        </div>
                                        <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 text-red-600">
                                            <ChevronRight className="w-4 h-4" /> Accounts Payable
                                        </div>
                                        <div className="flex items-center gap-2 p-2 rounded bg-green-500/10 text-green-600">
                                            <ChevronRight className="w-4 h-4" /> Revenue Accounts
                                        </div>
                                        <div className="flex items-center gap-2 p-2 rounded bg-orange-500/10 text-orange-600">
                                            <ChevronRight className="w-4 h-4" /> Expense Accounts
                                        </div>
                                        <div className="flex items-center gap-2 p-2 rounded bg-teal-500/10 text-teal-600">
                                            <ChevronRight className="w-4 h-4" /> Equity Accounts
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Fiscal Year */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Fiscal Year Starts</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {months.map((month, i) => (
                                        <button
                                            key={month}
                                            onClick={() => setFormData({ ...formData, fiscalYearStart: i + 1 })}
                                            className={`p-3 rounded-lg border text-sm transition-all ${formData.fiscalYearStart === i + 1
                                                ? "border-primary bg-primary text-primary-foreground"
                                                : "border-border hover:border-primary/50"
                                                }`}
                                        >
                                            {month.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-sm text-muted-foreground mt-3">
                                    Your fiscal year will run from {months[formData.fiscalYearStart - 1]} to {months[(formData.fiscalYearStart + 10) % 12]}
                                </p>
                            </div>

                            {/* Summary */}
                            <div className="bg-muted/50 rounded-xl p-5 mt-6">
                                <h3 className="font-semibold mb-3">Summary</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Company Name</span>
                                        <span className="font-medium">{formData.companyName || "Not set"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Company Type</span>
                                        <span className="font-medium">{companyTypes.find(t => t.value === formData.companyType)?.label}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Currency</span>
                                        <span className="font-medium">{formData.currency}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Fiscal Year</span>
                                        <span className="font-medium">Starts {months[formData.fiscalYearStart - 1]}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-border">
                        <button
                            onClick={handlePrev}
                            disabled={currentStep === 1}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>

                        {currentStep < steps.length ? (
                            <button
                                onClick={handleNext}
                                disabled={currentStep === 1 && !formData.companyName}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                            >
                                Continue
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Complete Setup
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Skip */}
                <div className="text-center mt-4">
                    <button
                        onClick={() => router.push(`/${locale}/dashboard`)}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Skip for now →
                    </button>
                </div>
            </div>
        </div>
    );
}
