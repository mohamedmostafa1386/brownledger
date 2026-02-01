import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

export const locales = ["en", "ar"] as const;
export const defaultLocale = "en" as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
    en: "English",
    ar: "العربية",
};

export const localeFlags: Record<Locale, string> = {
    en: "🇬🇧",
    ar: "🇪🇬",
};

export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;
    console.log('[i18n] Request Locale:', locale, 'Type:', typeof locale);

    // Unstable header check as fallback
    if (!locale || !locales.includes(locale as any)) {
        const headerList = await headers();
        const headerLocale = headerList.get("X-NEXT-INTL-LOCALE");
        if (headerLocale && locales.includes(headerLocale as any)) {
            console.log('[i18n] Fallback to header locale:', headerLocale);
            locale = headerLocale as Locale;
        } else {
            // Second fallback: check referer or path if possible? 
            // For now default to ar
            locale = defaultLocale;
        }
    }
    console.log('[i18n] Resolved Locale:', locale);

    return {
        locale: locale as string,
        messages: (await import(`./messages/${locale}.json`)).default,
    };
});

