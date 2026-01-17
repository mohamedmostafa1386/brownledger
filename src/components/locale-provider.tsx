"use client";

import { createContext, useContext, ReactNode } from "react";

interface LocaleContextType {
    locale: string;
    isRTL: boolean;
    dir: "ltr" | "rtl";
}

const LocaleContext = createContext<LocaleContextType>({
    locale: "en",
    isRTL: false,
    dir: "ltr",
});

export function useLocaleInfo() {
    return useContext(LocaleContext);
}

export function LocaleProvider({
    children,
    locale,
}: {
    children: ReactNode;
    locale: string;
}) {
    const isRTL = locale === "ar";
    const dir = isRTL ? "rtl" : "ltr";

    return (
        <LocaleContext.Provider value={{ locale, isRTL, dir }}>
            {children}
        </LocaleContext.Provider>
    );
}
