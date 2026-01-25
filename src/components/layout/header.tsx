"use client";

import { useState, useEffect } from "react";
import { Bell, Search, Moon, Sun, LogOut, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { useI18n } from "@/lib/i18n-context";

export function Header() {
    const [isDark, setIsDark] = useState(false);
    const t = useTranslations("common");
    const { locale } = useI18n();
    const { toggle } = useSidebarStore();

    useEffect(() => {
        const isDarkMode = document.documentElement.classList.contains("dark");
        setIsDark(isDarkMode);
    }, []);

    const toggleTheme = () => {
        document.documentElement.classList.toggle("dark");
        setIsDark(!isDark);
    };

    const handleLogout = async () => {
        await signOut({ callbackUrl: `/${locale}/login` });
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                    onClick={toggle}
                    className="lg:hidden -ms-2 rounded-lg p-2 text-muted-foreground hover:bg-muted"
                >
                    <Menu className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-semibold">{t("appName")}</h1>
            </div>

            <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative hidden md:block">
                    <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={t("search")}
                        className="h-9 w-64 rounded-lg border border-input bg-background ps-9 pe-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                {/* Notifications */}
                <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-input bg-background hover:bg-muted">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span className="absolute end-1 top-1 h-2 w-2 rounded-full bg-destructive" />
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-input bg-background hover:bg-muted"
                >
                    {isDark ? (
                        <Sun className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <Moon className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    data-testid="user-menu"
                    className="flex h-9 items-center gap-2 px-3 rounded-lg border border-input bg-background hover:bg-muted text-sm"
                    title="Logout"
                >
                    <LogOut className="h-4 w-4 text-muted-foreground" />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
        </header>
    );
}
