// Multi-Currency Support
// Exchange rates and currency conversion utilities

export interface Currency {
    code: string;
    name: string;
    nameAr: string;
    symbol: string;
    decimals: number;
}

export interface ExchangeRate {
    from: string;
    to: string;
    rate: number;
    date: string;
}

// Supported currencies
export const CURRENCIES: Currency[] = [
    { code: "EGP", name: "Egyptian Pound", nameAr: "جنيه مصري", symbol: "£", decimals: 2 },
    { code: "USD", name: "US Dollar", nameAr: "دولار أمريكي", symbol: "$", decimals: 2 },
    { code: "EUR", name: "Euro", nameAr: "يورو", symbol: "€", decimals: 2 },
    { code: "GBP", name: "British Pound", nameAr: "جنيه إسترليني", symbol: "£", decimals: 2 },
    { code: "SAR", name: "Saudi Riyal", nameAr: "ريال سعودي", symbol: "﷼", decimals: 2 },
    { code: "AED", name: "UAE Dirham", nameAr: "درهم إماراتي", symbol: "د.إ", decimals: 2 },
    { code: "KWD", name: "Kuwaiti Dinar", nameAr: "دينار كويتي", symbol: "د.ك", decimals: 3 },
    { code: "QAR", name: "Qatari Riyal", nameAr: "ريال قطري", symbol: "ر.ق", decimals: 2 },
    { code: "BHD", name: "Bahraini Dinar", nameAr: "دينار بحريني", symbol: "د.ب", decimals: 3 },
    { code: "OMR", name: "Omani Rial", nameAr: "ريال عماني", symbol: "ر.ع", decimals: 3 },
    { code: "JOD", name: "Jordanian Dinar", nameAr: "دينار أردني", symbol: "د.أ", decimals: 3 },
    { code: "LBP", name: "Lebanese Pound", nameAr: "ليرة لبنانية", symbol: "ل.ل", decimals: 0 },
];

// Default exchange rates (EGP as base) - would be fetched from API in production
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
    EGP: 1,
    USD: 0.0324,    // 1 EGP = 0.0324 USD
    EUR: 0.0297,    // 1 EGP = 0.0297 EUR
    GBP: 0.0255,    // 1 EGP = 0.0255 GBP
    SAR: 0.1214,    // 1 EGP = 0.1214 SAR
    AED: 0.1189,    // 1 EGP = 0.1189 AED
    KWD: 0.01,      // 1 EGP = 0.01 KWD
    QAR: 0.118,     // 1 EGP = 0.118 QAR
    BHD: 0.0122,    // 1 EGP = 0.0122 BHD
    OMR: 0.0125,    // 1 EGP = 0.0125 OMR
    JOD: 0.023,     // 1 EGP = 0.023 JOD
    LBP: 2900,      // 1 EGP = 2900 LBP
};

// Get currency by code
export function getCurrency(code: string): Currency | undefined {
    return CURRENCIES.find(c => c.code === code);
}

// Convert amount between currencies
export function convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    customRates?: Record<string, number>
): number {
    if (fromCurrency === toCurrency) return amount;

    const rates = customRates || DEFAULT_EXCHANGE_RATES;
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;

    // Convert to base (EGP) then to target
    const baseAmount = amount / fromRate;
    const targetAmount = baseAmount * toRate;

    const targetCurrency = getCurrency(toCurrency);
    const decimals = targetCurrency?.decimals || 2;

    return Math.round(targetAmount * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// Format currency amount
export function formatAmount(
    amount: number,
    currencyCode: string,
    locale: string = "en"
): string {
    const currency = getCurrency(currencyCode);
    if (!currency) {
        return `${amount.toFixed(2)} ${currencyCode}`;
    }

    const formattedNumber = new Intl.NumberFormat(
        locale === "ar" ? "ar-EG" : "en-US",
        {
            minimumFractionDigits: currency.decimals,
            maximumFractionDigits: currency.decimals,
        }
    ).format(amount);

    return `${currency.symbol}${formattedNumber}`;
}

// Get exchange rate display
export function getExchangeRateDisplay(
    fromCurrency: string,
    toCurrency: string,
    customRates?: Record<string, number>
): string {
    if (fromCurrency === toCurrency) return "1:1";

    const rates = customRates || DEFAULT_EXCHANGE_RATES;
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;

    const rate = toRate / fromRate;

    if (rate < 1) {
        return `1 ${fromCurrency} = ${(1 / rate).toFixed(4)} ${toCurrency}`;
    }
    return `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
}

// Calculate foreign currency gain/loss
export function calculateFXGainLoss(
    originalAmount: number,
    originalCurrency: string,
    originalRate: number,
    settlementAmount: number,
    settlementCurrency: string,
    settlementRate: number,
    baseCurrency: string = "EGP"
): {
    gainLoss: number;
    isGain: boolean;
    description: string;
} {
    // Convert both to base currency at historical rates
    const originalInBase = originalAmount * originalRate;
    const settlementInBase = settlementAmount * settlementRate;

    const gainLoss = settlementInBase - originalInBase;
    const isGain = gainLoss > 0;

    return {
        gainLoss: Math.abs(gainLoss),
        isGain,
        description: `${isGain ? "Gain" : "Loss"} of ${formatAmount(Math.abs(gainLoss), baseCurrency)} on FX settlement`,
    };
}

// Fetch live exchange rates (would use real API in production)
export async function fetchExchangeRates(baseCurrency: string = "EGP"): Promise<Record<string, number>> {
    // In production, fetch from API like:
    // - Central Bank of Egypt
    // - Open Exchange Rates
    // - Fixer.io
    // - CurrencyLayer

    // For now, return default rates
    return DEFAULT_EXCHANGE_RATES;
}

// Multi-currency transaction interface
export interface MultiCurrencyTransaction {
    id: string;
    date: Date;
    description: string;
    originalAmount: number;
    originalCurrency: string;
    exchangeRate: number;
    baseAmount: number; // Amount in base currency
    baseCurrency: string;
}

// Helper to create multi-currency transaction record
export function createMultiCurrencyTransaction(
    id: string,
    date: Date,
    description: string,
    amount: number,
    currency: string,
    baseCurrency: string = "EGP"
): MultiCurrencyTransaction {
    const rate = DEFAULT_EXCHANGE_RATES[currency] || 1;
    const baseRate = DEFAULT_EXCHANGE_RATES[baseCurrency] || 1;
    const exchangeRate = baseRate / rate;

    return {
        id,
        date,
        description,
        originalAmount: amount,
        originalCurrency: currency,
        exchangeRate,
        baseAmount: amount * exchangeRate,
        baseCurrency,
    };
}
