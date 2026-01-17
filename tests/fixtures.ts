import { test as base, expect } from '@playwright/test';

// Extend base test with authentication
export const test = base.extend<{ authenticatedPage: void }>({
    authenticatedPage: async ({ page }, use) => {
        // Login before test - app uses /login (not /en/login)
        await page.goto('/login');
        await page.fill('#email', 'admin@brownledger.com');
        await page.fill('#password', 'demo123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/(dashboard|pos|invoices)/, { timeout: 10000 });
        await use();
    },
});

export { expect };

// Helper to format currency for assertions
export function formatTestCurrency(amount: number): string {
    return new Intl.NumberFormat('en-EG', {
        style: 'currency',
        currency: 'EGP',
    }).format(amount);
}

// Helper to wait for API response
export async function waitForApiResponse(page: any, urlPattern: string | RegExp) {
    return page.waitForResponse((response: any) =>
        response.url().match(urlPattern) && response.status() === 200
    );
}

// Helper to login - uses correct path and credentials
export async function login(page: any, locale: string = 'en') {
    // Login page is at /login (no locale prefix)
    await page.goto('/login');
    await page.fill('#email', 'admin@brownledger.com');
    await page.fill('#password', 'demo123');
    await page.click('button[type="submit"]');
    // After login, pages are at /{locale}/dashboard or /dashboard
    await page.waitForURL(/\/(dashboard|en|ar)/, { timeout: 10000 });
}
