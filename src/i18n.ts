import { getRequestConfig } from "next-intl/server";

export const locales = ["en", "ar"] as const;
export const defaultLocale = "ar" as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
    en: "English",
    ar: "العربية",
};

export const localeFlags: Record<Locale, string> = {
    en: "🇬🇧",
    ar: "🇪🇬",
};

export default getRequestConfig(async ({ locale }) => {
    return {
        locale: locale as string,
        messages: (await import(`./messages/${locale}.json`)).default,
    };
});

