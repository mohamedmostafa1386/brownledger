"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";



interface DashboardShellProps {
    children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
    // Single Source of Truth - derive from URL params
    const params = useParams();
    const locale = params?.locale;
    const isRTL = locale === "ar";

    // Explicit padding logic for maximum stability
    return (
        <div className={`transition-all duration-300 ${isRTL ? "lg:pr-64 pr-0" : "lg:pl-64 pl-0"}`}>
            {children}
        </div>
    );
}
