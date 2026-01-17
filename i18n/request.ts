import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export const locales = ["en", "ar", "fr"] as const;
export const defaultLocale = "en" as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async () => {
    // Try to get locale from cookie first
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get("NEXT_LOCALE");

    let locale: Locale = defaultLocale;

    if (localeCookie && locales.includes(localeCookie.value as Locale)) {
        locale = localeCookie.value as Locale;
    } else {
        // Fall back to Accept-Language header
        const headersList = await headers();
        const acceptLanguage = headersList.get("Accept-Language") || "";

        // Parse Accept-Language header
        const preferredLocales = acceptLanguage
            .split(",")
            .map((lang) => lang.split(";")[0].trim().substring(0, 2));

        for (const preferred of preferredLocales) {
            if (locales.includes(preferred as Locale)) {
                locale = preferred as Locale;
                break;
            }
        }
    }

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default,
    };
});
