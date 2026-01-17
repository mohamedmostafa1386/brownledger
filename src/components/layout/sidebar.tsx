"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import {
    LayoutDashboard,
    FileText,
    Receipt,
    Users,
    Building2,
    PieChart,
    Settings,
    LogOut,
    ChevronDown,
    Truck,
    CreditCard,
    Package,
    ShoppingCart,
    Box,
    BarChart3,
    DollarSign,
    Clock,
    BookOpen,
    Calculator,
    TrendingUp,
    Wallet,
    ArrowRightLeft,
    Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocaleStore } from "@/lib/stores/locale-store";
import { useI18n } from "@/lib/i18n-context";

import { permissions, canAccessModule } from "@/lib/rbac";
import { Users2 } from "lucide-react";

import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { X } from "lucide-react";

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { t, locale, dir } = useI18n();
    const userRole = (session?.user as any)?.role || "VIEWER";

    // Use Zustand store for text RTL switching
    const { isRTL, setLocale } = useLocaleStore();
    const { isOpen, close } = useSidebarStore();

    // Sync locale to Zustand store on mount
    useEffect(() => {
        setLocale(locale);
    }, [locale, setLocale]);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        close();
    }, [pathname, close]);

    const navItems = [
        { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard, module: "dashboard" },
        { href: "/pos", label: t("nav.pos"), icon: ShoppingCart, highlight: true, module: "pos" },
        { href: "/stock", label: t("nav.stock"), icon: Package, module: "stock" },
        { href: "/invoices", label: t("nav.invoices"), icon: FileText, module: "invoices" },
        { href: "/expenses", label: t("nav.expenses"), icon: Receipt, module: "expenses" },
        { href: "/clients", label: t("nav.clients"), icon: Users, module: "clients" },
        { href: "/suppliers", label: t("nav.suppliers"), icon: Truck, module: "suppliers" },
        { href: "/bills", label: locale === "ar" ? "المشتريات" : "Purchases", icon: CreditCard, module: "bills" },
        { href: "/purchase-orders", label: locale === "ar" ? "أوامر الشراء" : "Purchase Orders", icon: ShoppingCart, module: "purchase-orders" },
        { href: "/banking", label: t("nav.banking"), icon: PieChart, module: "banking" },
        { href: "/banking/reconciliation", label: locale === "ar" ? "مطابقة البنك" : "Bank Reconciliation", icon: ArrowRightLeft, module: "banking" },
        { href: "/prepaid-expenses", label: t("nav.prepaidExpenses"), icon: Clock, module: "prepaid-expenses" },
        { href: "/loans", label: t("nav.loans"), icon: TrendingUp, module: "loans" },
        // Accounting Section
        { href: "/chart-of-accounts", label: t("nav.chartOfAccounts"), icon: BookOpen, module: "financials" },
        { href: "/journal-entries", label: t("nav.journalEntries"), icon: Wallet, module: "financials" },
        { href: "/financial-statements", label: t("nav.financialStatements"), icon: Calculator, module: "financials" },
        // Reports & Settings
        { href: "/reports", label: t("nav.reports"), icon: BarChart3, module: "reports" },
        { href: "/pos/shifts", label: locale === "ar" ? "ورديات الكاشير" : "Cashier Shifts", icon: Clock, module: "pos" },
        { href: "/team", label: locale === "ar" ? "إدارة الفريق" : "Team Management", icon: Users2, module: "team" },
        { href: "/settings", label: t("nav.settings"), icon: Settings, module: "settings" },
    ];

    const filteredNavItems = navItems.filter(item => canAccessModule(userRole, item.module));

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={close}
                />
            )}

            <aside className={cn(
                "fixed top-0 z-40 h-screen w-64 border-border bg-card transition-transform duration-300 ease-in-out lg:translate-x-0",
                isRTL
                    ? (isOpen ? "right-0 translate-x-0 border-s" : "right-0 translate-x-full lg:translate-x-0 border-s")
                    : (isOpen ? "left-0 translate-x-0 border-e" : "left-0 -translate-x-full lg:translate-x-0 border-e")
            )}>
                <div className="flex h-full flex-col">
                    {/* Logo */}
                    <div className="flex h-16 items-center justify-between border-b border-border px-6">
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                                <span className="text-sm font-bold text-primary-foreground">BL</span>
                            </div>
                            <span className="text-lg font-semibold tracking-tight">BrownLedger</span>
                        </div>
                        {/* Mobile Close Button */}
                        <button onClick={close} className="lg:hidden text-muted-foreground hover:text-foreground">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Company Switcher */}
                    <div className="border-b border-border p-4">
                        <button className="flex w-full items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm hover:bg-muted/80">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                                    H
                                </div>
                                <span className="font-medium">Hagar Hamdy</span>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                        {filteredNavItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="h-4 w-4 flex-shrink-0" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User Section */}
                    <div className="border-t border-border p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary flex-shrink-0">
                                {session?.user?.name?.[0] || "U"}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="truncate text-sm font-medium">{session?.user?.name || "User"}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {session?.user?.email || ""}
                                </p>
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground flex-shrink-0"
                                title={t("common.close")}
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
