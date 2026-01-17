"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LocaleStore {
    locale: string;
    isRTL: boolean;
    setLocale: (locale: string) => void;
}

export const useLocaleStore = create<LocaleStore>()(
    persist(
        (set) => ({
            locale: "en",
            isRTL: false,
            setLocale: (locale: string) => {
                const isRTL = locale === "ar";
                set({ locale, isRTL });

                // Update document direction immediately for instant switching
                if (typeof document !== "undefined") {
                    document.documentElement.dir = isRTL ? "rtl" : "ltr";
                    document.documentElement.lang = locale;

                    // Update body classes
                    document.body.classList.toggle("rtl", isRTL);
                    document.body.classList.toggle("ltr", !isRTL);
                    document.body.classList.toggle("font-arabic", isRTL);

                    // Set cookie for server-side
                    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
                }
            },
        }),
        {
            name: "brownledger-locale",
        }
    )
);

// Hook to get isRTL for components
export function useIsRTL() {
    return useLocaleStore((state) => state.isRTL);
}

// Hook to get current locale
export function useCurrentLocale() {
    return useLocaleStore((state) => state.locale);
}
