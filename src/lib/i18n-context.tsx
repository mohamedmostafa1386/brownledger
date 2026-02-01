"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import enMessages from "@/messages/en.json";
import arMessages from "@/messages/ar.json";
import frMessages from "@/messages/fr.json";

type Messages = typeof enMessages;
type Locale = "en" | "ar" | "fr" | "de" | "es";

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
    dir: "ltr" | "rtl";
    messages: Messages;
}

const messages: Record<string, Messages> = {
    en: enMessages,
    ar: arMessages,
    fr: frMessages as any,
    de: enMessages, // fallback to English
    es: enMessages, // fallback to English
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children, locale: initialLocale }: { children: ReactNode; locale: string }) {
    const [locale, setLocaleState] = useState<Locale>(initialLocale as Locale);
    const [isInitialized, setIsInitialized] = useState(false);

    // Sync with prop if it changes (e.g. navigation)
    useEffect(() => {
        if (initialLocale) {
            setLocaleState(initialLocale as Locale);
            document.documentElement.dir = initialLocale === "ar" ? "rtl" : "ltr";
            document.documentElement.lang = initialLocale;
        }
    }, [initialLocale]);

    useEffect(() => {
        setIsInitialized(true);
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem("app_language", newLocale);
        // Set document direction
        document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = newLocale;
        // Set cookie for server-side
        document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    };

    const t = (key: string): string => {
        const keys = key.split(".");
        let result: unknown = messages[locale] || messages.en;

        for (const k of keys) {
            if (result && typeof result === "object" && k in result) {
                result = (result as Record<string, unknown>)[k];
            } else {
                // Fallback to English
                result = messages.en;
                for (const fallbackKey of keys) {
                    if (result && typeof result === "object" && fallbackKey in result) {
                        result = (result as Record<string, unknown>)[fallbackKey];
                    } else {
                        return key;
                    }
                }
                break;
            }
        }

        return typeof result === "string" ? result : key;
    };

    const dir = locale === "ar" ? "rtl" : "ltr";

    // Use prop locale immediately, no need to wait for hydration if we trust the server
    return (
        <I18nContext.Provider value={{ locale, setLocale, t, dir, messages: messages[locale] || messages.en }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error("useI18n must be used within an I18nProvider");
    }
    return context;
}

// Hook for just the translation function
export function useTranslation() {
    const { t, locale, dir } = useI18n();
    return { t, locale, dir };
}
