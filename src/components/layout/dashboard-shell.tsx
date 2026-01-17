"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useLocaleStore } from "@/lib/stores/locale-store";

interface DashboardShellProps {
    children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
    const locale = useLocale();
    const { isRTL, setLocale } = useLocaleStore();

    // Sync server locale to Zustand store on mount
    useEffect(() => {
        setLocale(locale);
    }, [locale, setLocale]);

    return (
        <div
            className={`transition-all duration-300 ${isRTL
                    ? "lg:pr-64 pr-0"
                    : "lg:pl-64 pl-0"
                }`}
        >
            {children}
        </div>
    );
}
