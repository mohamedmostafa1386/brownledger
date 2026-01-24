"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n-context";
import {
    Building2,
    Users,
    UserCircle,
    Settings,
    Save,
    Plus,
    Trash2,
    DollarSign,
    Percent,
    Calendar,
    Globe,
    Moon,
    Sun,
    Bot,
    Key,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useLocaleStore } from "@/lib/stores/locale-store";

type CompanyType = "SOLE_PROPRIETORSHIP" | "PARTNERSHIP" | "LLC" | "CORPORATION";

interface Partner {
    id: string;
    name: string;
    email?: string;
    ownershipPercent: number;
    profitSharePercent: number;
    capitalContribution: number;
    currentCapital: number;
    drawings: number;
}

interface Shareholder {
    id: string;
    name: string;
    email?: string;
    shareClass: string;
    sharesOwned: number;
    sharePrice: number;
    totalInvestment: number;
}

export default function SettingsPage() {
    const { t } = useI18n();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<"general" | "company" | "partners" | "shareholders">("general");
    const [showAddPartner, setShowAddPartner] = useState(false);
    const [showAddShareholder, setShowAddShareholder] = useState(false);

    // Language/Theme state
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const { setLocale: setStoreLocale } = useLocaleStore();
    const [isDark, setIsDark] = useState(false);
    const [openRouterApiKey, setOpenRouterApiKey] = useState("");
    const [openRouterModel, setOpenRouterModel] = useState("google/gemini-2.0-flash-exp:free");

    // Load theme and API settings on mount
    useState(() => {
        if (typeof window !== "undefined") {
            setIsDark(document.documentElement.classList.contains("dark"));
            setOpenRouterApiKey(localStorage.getItem("openrouter_api_key") || "");
            setOpenRouterModel(localStorage.getItem("openrouter_model") || "google/gemini-2.0-flash-exp:free");
        }
    });

    // Form states
    const [companyType, setCompanyType] = useState<CompanyType>("LLC");
    const [authorizedShares, setAuthorizedShares] = useState(10000);
    const [parValue, setParValue] = useState(1);
    const [fiscalYearStart, setFiscalYearStart] = useState(1);

    // New partner/shareholder forms
    const [newPartner, setNewPartner] = useState({ name: "", email: "", ownershipPercent: 0, capitalContribution: 0 });
    const [newShareholder, setNewShareholder] = useState({ name: "", email: "", shareClass: "COMMON", sharesOwned: 0, sharePrice: 1 });

    // Fetch company settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ["company-settings"],
        queryFn: () => fetch("/api/company/settings").then(r => r.json()),
    });

    // Fetch partners
    const { data: partnersData } = useQuery({
        queryKey: ["partners"],
        queryFn: () => fetch("/api/company/partners").then(r => r.json()),
        enabled: companyType === "PARTNERSHIP",
    });

    // Fetch shareholders
    const { data: shareholdersData } = useQuery({
        queryKey: ["shareholders"],
        queryFn: () => fetch("/api/company/shareholders").then(r => r.json()),
        enabled: companyType === "CORPORATION",
    });

    // Update company mutation
    const updateCompany = useMutation({
        mutationFn: (data: any) => fetch("/api/company/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        }).then(r => r.json()),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["company-settings"] }),
    });

    // Add partner mutation
    const addPartner = useMutation({
        mutationFn: (data: any) => fetch("/api/company/partners", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        }).then(r => r.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["partners"] });
            setShowAddPartner(false);
            setNewPartner({ name: "", email: "", ownershipPercent: 0, capitalContribution: 0 });
        },
    });

    // Add shareholder mutation
    const addShareholder = useMutation({
        mutationFn: (data: any) => fetch("/api/company/shareholders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        }).then(r => r.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["shareholders"] });
            setShowAddShareholder(false);
            setNewShareholder({ name: "", email: "", shareClass: "COMMON", sharesOwned: 0, sharePrice: 1 });
        },
    });

    const companyTypes = [
        { value: "SOLE_PROPRIETORSHIP", label: "Sole Proprietorship", icon: UserCircle, description: "Single owner business" },
        { value: "PARTNERSHIP", label: "Partnership", icon: Users, description: "Multiple partners with profit sharing" },
        { value: "LLC", label: "Limited Liability Company", icon: Building2, description: "LLC with member equity" },
        { value: "CORPORATION", label: "Corporation", icon: Building2, description: "Stock company with shareholders" },
    ];

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const languages = [
        { code: "en", name: "English", flag: "🇬🇧" },
        { code: "ar", name: "العربية", flag: "🇪🇬" },
    ];

    const aiModels = [
        { value: "google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 Flash (Free)" },
        { value: "google/gemini-pro", label: "Gemini Pro" },
        { value: "openai/gpt-4o-mini", label: "GPT-4o Mini" },
        { value: "openai/gpt-4o", label: "GPT-4o" },
        { value: "anthropic/claude-3-haiku", label: "Claude 3 Haiku" },
        { value: "anthropic/claude-3-sonnet", label: "Claude 3 Sonnet" },
    ];

    const switchLanguage = (newLocale: string) => {
        if (newLocale === locale) return;
        setStoreLocale(newLocale);
        const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, "") || "/";
        router.push(pathWithoutLocale);
        router.refresh();
    };

    const toggleTheme = () => {
        document.documentElement.classList.toggle("dark");
        setIsDark(!isDark);
    };

    const saveAISettings = () => {
        localStorage.setItem("openrouter_api_key", openRouterApiKey);
        localStorage.setItem("openrouter_model", openRouterModel);
    };

    const handleSave = () => {
        updateCompany.mutate({
            companyId: "demo-company",
            companyType,
            authorizedShares: companyType === "CORPORATION" ? authorizedShares : null,
            parValuePerShare: companyType === "CORPORATION" ? parValue : null,
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t("settings")}</h1>
                    <p className="text-muted-foreground">{locale === "ar" ? "تكوين إعدادات الشركة" : "Configure your company settings"}</p>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                    <Save className="w-4 h-4" />
                    {locale === "ar" ? "حفظ التغييرات" : "Save Changes"}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
                <button
                    onClick={() => setActiveTab("general")}
                    className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "general" ? "bg-card border border-b-0" : "text-muted-foreground"}`}
                >
                    <Globe className="w-4 h-4 inline me-2" />
                    {locale === "ar" ? "عام" : "General"}
                </button>
                <button
                    onClick={() => setActiveTab("company")}
                    className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "company" ? "bg-card border border-b-0" : "text-muted-foreground"}`}
                >
                    <Settings className="w-4 h-4 inline me-2" />
                    {locale === "ar" ? "الشركة" : "Company"}
                </button>
                {companyType === "PARTNERSHIP" && (
                    <button
                        onClick={() => setActiveTab("partners")}
                        className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "partners" ? "bg-card border border-b-0" : "text-muted-foreground"}`}
                    >
                        <Users className="w-4 h-4 inline me-2" />
                        {locale === "ar" ? "الشركاء" : "Partners"}
                    </button>
                )}
                {companyType === "CORPORATION" && (
                    <button
                        onClick={() => setActiveTab("shareholders")}
                        className={`px-4 py-2 font-medium rounded-t-lg ${activeTab === "shareholders" ? "bg-card border border-b-0" : "text-muted-foreground"}`}
                    >
                        <Users className="w-4 h-4 inline me-2" />
                        {locale === "ar" ? "المساهمين" : "Shareholders"}
                    </button>
                )}
            </div>

            {/* General Settings Tab */}
            {activeTab === "general" && (
                <div className="space-y-6">
                    {/* Language Settings */}
                    <div className="bg-card rounded-lg border border-border p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Globe className="w-5 h-5" />
                            {locale === "ar" ? "اللغة والمنطقة" : "Language & Region"}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {languages.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => switchLanguage(lang.code)}
                                    className={`p-4 rounded-lg border-2 text-left transition-all flex items-center gap-4 ${locale === lang.code
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    <span className="text-3xl">{lang.flag}</span>
                                    <div>
                                        <h3 className="font-semibold">{lang.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {lang.code === "ar" ? "Right-to-Left" : "Left-to-Right"}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Theme Settings */}
                    <div className="bg-card rounded-lg border border-border p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            {locale === "ar" ? "المظهر" : "Appearance"}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => { if (isDark) toggleTheme(); }}
                                className={`p-4 rounded-lg border-2 text-left transition-all flex items-center gap-4 ${!isDark
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                    }`}
                            >
                                <div className="p-3 bg-amber-100 rounded-lg">
                                    <Sun className="w-6 h-6 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{locale === "ar" ? "الوضع الفاتح" : "Light Mode"}</h3>
                                    <p className="text-sm text-muted-foreground">{locale === "ar" ? "واجهة مشرقة ونظيفة" : "Bright and clean interface"}</p>
                                </div>
                            </button>
                            <button
                                onClick={() => { if (!isDark) toggleTheme(); }}
                                className={`p-4 rounded-lg border-2 text-left transition-all flex items-center gap-4 ${isDark
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                    }`}
                            >
                                <div className="p-3 bg-slate-800 rounded-lg">
                                    <Moon className="w-6 h-6 text-slate-300" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{locale === "ar" ? "الوضع الداكن" : "Dark Mode"}</h3>
                                    <p className="text-sm text-muted-foreground">{locale === "ar" ? "مريح للعينين" : "Easy on the eyes"}</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* AI Settings */}
                    <div className="bg-card rounded-lg border border-border p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Bot className="w-5 h-5" />
                            {locale === "ar" ? "إعدادات المساعد الذكي" : "AI Assistant Settings"}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                                    <Key className="w-4 h-4" />
                                    {locale === "ar" ? "مفتاح OpenRouter API" : "OpenRouter API Key"}
                                </label>
                                <input
                                    type="password"
                                    value={openRouterApiKey}
                                    onChange={(e) => setOpenRouterApiKey(e.target.value)}
                                    placeholder="sk-or-..."
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    Get your key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">openrouter.ai/keys</a>
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{locale === "ar" ? "نموذج الذكاء الاصطناعي" : "AI Model"}</label>
                                <select
                                    value={openRouterModel}
                                    onChange={(e) => setOpenRouterModel(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                                >
                                    {aiModels.map((model) => (
                                        <option key={model.value} value={model.value}>{model.label}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={saveAISettings}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                            >
                                {locale === "ar" ? "حفظ إعدادات الذكاء الاصطناعي" : "Save AI Settings"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Company Settings Tab */}
            {activeTab === "company" && (
                <div className="space-y-6">
                    {/* Company Type Selection */}
                    <div className="bg-card rounded-lg border border-border p-6">
                        <h2 className="text-lg font-semibold mb-4">Company Type</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {companyTypes.map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => setCompanyType(type.value as CompanyType)}
                                    className={`p-4 rounded-lg border-2 text-left transition-all ${companyType === type.value
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    <type.icon className={`w-8 h-8 mb-2 ${companyType === type.value ? "text-primary" : "text-muted-foreground"}`} />
                                    <h3 className="font-semibold">{type.label}</h3>
                                    <p className="text-sm text-muted-foreground">{type.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Corporation-specific settings */}
                    {companyType === "CORPORATION" && (
                        <div className="bg-card rounded-lg border border-border p-6">
                            <h2 className="text-lg font-semibold mb-4">Stock Settings</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Authorized Shares</label>
                                    <input
                                        type="number"
                                        value={authorizedShares}
                                        onChange={(e) => setAuthorizedShares(Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Maximum shares the company can issue</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Par Value per Share</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={parValue}
                                        onChange={(e) => setParValue(Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Nominal value per share</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Fiscal Year */}
                    <div className="bg-card rounded-lg border border-border p-6">
                        <h2 className="text-lg font-semibold mb-4">Fiscal Year</h2>
                        <div className="max-w-xs">
                            <label className="block text-sm font-medium mb-1">Fiscal Year Starts</label>
                            <select
                                value={fiscalYearStart}
                                onChange={(e) => setFiscalYearStart(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                            >
                                {months.map((month, i) => (
                                    <option key={i} value={i + 1}>{month}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Equity Template Preview */}
                    {settings?.equityTemplate && (
                        <div className="bg-card rounded-lg border border-border p-6">
                            <h2 className="text-lg font-semibold mb-4">Equity Structure: {settings.equityTemplate.name}</h2>
                            <div className="space-y-2">
                                {settings.equityTemplate.accounts?.map((acc: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                                        <span className="font-mono text-sm text-muted-foreground">{acc.code}</span>
                                        <span className="font-medium">{acc.name}</span>
                                        <span className="text-sm text-muted-foreground">- {acc.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Partners Tab */}
            {activeTab === "partners" && (
                <div className="bg-card rounded-lg border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Partners</h2>
                        <button
                            onClick={() => setShowAddPartner(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Partner
                        </button>
                    </div>

                    {/* Partner List */}
                    <div className="space-y-3">
                        {(partnersData?.partners || []).map((partner: Partner) => (
                            <div key={partner.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                <div>
                                    <h3 className="font-semibold">{partner.name}</h3>
                                    <p className="text-sm text-muted-foreground">{partner.email}</p>
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="text-center">
                                        <Percent className="w-4 h-4 mx-auto text-muted-foreground" />
                                        <span className="font-semibold">{partner.ownershipPercent}%</span>
                                        <p className="text-xs text-muted-foreground">Ownership</p>
                                    </div>
                                    <div className="text-center">
                                        <DollarSign className="w-4 h-4 mx-auto text-muted-foreground" />
                                        <span className="font-semibold">${partner.currentCapital.toLocaleString()}</span>
                                        <p className="text-xs text-muted-foreground">Capital</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    {partnersData?.summary && (
                        <div className="mt-4 pt-4 border-t border-border flex gap-6">
                            <div>
                                <span className="text-sm text-muted-foreground">Total Ownership:</span>
                                <span className="ms-2 font-semibold">{partnersData.summary.totalOwnership}%</span>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">Total Capital:</span>
                                <span className="ms-2 font-semibold">${partnersData.summary.totalCapital?.toLocaleString()}</span>
                            </div>
                        </div>
                    )}

                    {/* Add Partner Modal */}
                    {showAddPartner && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-card rounded-lg p-6 w-full max-w-md">
                                <h3 className="text-lg font-semibold mb-4">Add Partner</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={newPartner.name}
                                            onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={newPartner.email}
                                            onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Ownership %</label>
                                        <input
                                            type="number"
                                            value={newPartner.ownershipPercent}
                                            onChange={(e) => setNewPartner({ ...newPartner, ownershipPercent: Number(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Capital Contribution</label>
                                        <input
                                            type="number"
                                            value={newPartner.capitalContribution}
                                            onChange={(e) => setNewPartner({ ...newPartner, capitalContribution: Number(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button onClick={() => setShowAddPartner(false)} className="px-4 py-2 rounded-lg border border-border">Cancel</button>
                                    <button
                                        onClick={() => addPartner.mutate(newPartner)}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                                    >
                                        Add Partner
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Shareholders Tab */}
            {activeTab === "shareholders" && (
                <div className="bg-card rounded-lg border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Shareholders</h2>
                        <button
                            onClick={() => setShowAddShareholder(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Issue Shares
                        </button>
                    </div>

                    {/* Shareholder List */}
                    <div className="space-y-3">
                        {(shareholdersData?.shareholders || []).map((sh: Shareholder) => (
                            <div key={sh.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                                <div>
                                    <h3 className="font-semibold">{sh.name}</h3>
                                    <p className="text-sm text-muted-foreground">{sh.shareClass} Stock</p>
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                    <div className="text-center">
                                        <span className="font-semibold">{sh.sharesOwned.toLocaleString()}</span>
                                        <p className="text-xs text-muted-foreground">Shares</p>
                                    </div>
                                    <div className="text-center">
                                        <span className="font-semibold">${sh.totalInvestment.toLocaleString()}</span>
                                        <p className="text-xs text-muted-foreground">Investment</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Summary */}
                    {shareholdersData?.summary && (
                        <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-muted-foreground">Authorized:</span>
                                <span className="ms-2 font-semibold">{shareholdersData.summary.authorizedShares?.toLocaleString()}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Issued:</span>
                                <span className="ms-2 font-semibold">{shareholdersData.summary.issuedShares?.toLocaleString()}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">Par Value:</span>
                                <span className="ms-2 font-semibold">${shareholdersData.summary.totalParValue?.toLocaleString()}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground">APIC:</span>
                                <span className="ms-2 font-semibold">${shareholdersData.summary.additionalPaidInCapital?.toLocaleString()}</span>
                            </div>
                        </div>
                    )}

                    {/* Add Shareholder Modal */}
                    {showAddShareholder && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-card rounded-lg p-6 w-full max-w-md">
                                <h3 className="text-lg font-semibold mb-4">Issue Shares</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Shareholder Name</label>
                                        <input
                                            type="text"
                                            value={newShareholder.name}
                                            onChange={(e) => setNewShareholder({ ...newShareholder, name: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Share Class</label>
                                        <select
                                            value={newShareholder.shareClass}
                                            onChange={(e) => setNewShareholder({ ...newShareholder, shareClass: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                                        >
                                            <option value="COMMON">Common Stock</option>
                                            <option value="PREFERRED">Preferred Stock</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Number of Shares</label>
                                        <input
                                            type="number"
                                            value={newShareholder.sharesOwned}
                                            onChange={(e) => setNewShareholder({ ...newShareholder, sharesOwned: Number(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Price per Share</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newShareholder.sharePrice}
                                            onChange={(e) => setNewShareholder({ ...newShareholder, sharePrice: Number(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button onClick={() => setShowAddShareholder(false)} className="px-4 py-2 rounded-lg border border-border">Cancel</button>
                                    <button
                                        onClick={() => addShareholder.mutate(newShareholder)}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                                    >
                                        Issue Shares
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
