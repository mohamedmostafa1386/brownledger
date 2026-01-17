import { format as dateFnsFormat } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const dateLocales = {
    en: enUS,
    ar: ar,
};

/**
 * Format currency with locale-aware formatting
 */
export function formatCurrency(
    amount: number,
    locale: string = "en",
    currency: string = "EGP"
): string {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format number with locale-aware formatting
 */
export function formatNumber(
    value: number,
    locale: string = "en",
    options?: Intl.NumberFormatOptions
): string {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        ...options,
    }).format(value);
}

/**
 * Format date with locale-aware formatting
 */
export function formatDate(
    date: string | Date,
    locale: string = "en",
    formatStr: string = "PPP"
): string {
    const dateLocale = dateLocales[locale as keyof typeof dateLocales] || enUS;
    return dateFnsFormat(new Date(date), formatStr, { locale: dateLocale });
}

/**
 * Format date and time with locale-aware formatting
 */
export function formatDateTime(
    date: string | Date,
    locale: string = "en"
): string {
    const dateLocale = dateLocales[locale as keyof typeof dateLocales] || enUS;
    return dateFnsFormat(new Date(date), "PPp", { locale: dateLocale });
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(
    date: string | Date,
    locale: string = "en"
): string {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    const now = new Date();
    const target = new Date(date);
    const diffInSeconds = Math.floor((target.getTime() - now.getTime()) / 1000);

    const intervals = [
        { unit: "year", seconds: 31536000 },
        { unit: "month", seconds: 2592000 },
        { unit: "week", seconds: 604800 },
        { unit: "day", seconds: 86400 },
        { unit: "hour", seconds: 3600 },
        { unit: "minute", seconds: 60 },
        { unit: "second", seconds: 1 },
    ];

    for (const { unit, seconds } of intervals) {
        const diff = Math.floor(diffInSeconds / seconds);
        if (Math.abs(diff) >= 1) {
            return rtf.format(diff, unit as Intl.RelativeTimeFormatUnit);
        }
    }

    return rtf.format(0, "second");
}

/**
 * Format percentage with locale-aware formatting
 */
export function formatPercent(
    value: number,
    locale: string = "en",
    decimals: number = 1
): string {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : locale, {
        style: "percent",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value / 100);
}
