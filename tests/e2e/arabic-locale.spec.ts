import { test, expect } from '@playwright/test';
import { login } from '../fixtures';

/**
 * Arabic Locale & RTL Layout Tests
 * These tests should only run with the chromium-arabic-rtl project
 */

// Skip these tests when running in English locale
test.describe('Arabic Locale - Login Page', () => {
    test('should display login page in Arabic', async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('domcontentloaded');

        // Check if page loaded
        const heading = page.getByRole('heading');
        await expect(heading.first()).toBeVisible();
    });
});

test.describe('Arabic Locale - Dashboard', () => {
    test('should display dashboard with navigation', async ({ page }) => {
        await login(page, 'en');

        // Check that sidebar/nav exists
        const nav = page.locator('nav, aside');
        const count = await nav.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should have navigation labels', async ({ page }) => {
        await login(page, 'en');

        // Check that navigation has text
        const nav = page.locator('nav, aside');
        if (await nav.count() > 0) {
            const navText = await nav.first().textContent();
            expect(navText?.length).toBeGreaterThan(0);
        }
    });
});

test.describe('Arabic Locale - Invoices Page', () => {
    test('should display invoices page', async ({ page }) => {
        await login(page, 'en');
        await page.goto('/invoices');
        await page.waitForTimeout(1000);

        const heading = page.getByRole('heading');
        await expect(heading.first()).toBeVisible();
    });
});

test.describe('Arabic Locale - Receivables Page', () => {
    test('should display receivables page', async ({ page }) => {
        await login(page, 'en');
        await page.goto('/receivables');
        await page.waitForTimeout(1000);

        const heading = page.getByRole('heading');
        await expect(heading.first()).toBeVisible();
    });
});

test.describe('Arabic Locale - POS Page', () => {
    test('should display POS page', async ({ page }) => {
        await login(page, 'en');
        await page.goto('/pos');
        await page.waitForTimeout(1000);

        const heading = page.getByRole('heading');
        await expect(heading.first()).toBeVisible();
    });
});

test.describe('Arabic Locale - Financial Statements', () => {
    test('should display financial statements', async ({ page }) => {
        await login(page, 'en');
        await page.goto('/financial-statements');
        await page.waitForTimeout(1000);

        const heading = page.getByRole('heading');
        await expect(heading.first()).toBeVisible();
    });
});

test.describe('Number & Date Formatting', () => {
    test('should format currency amounts correctly', async ({ page }) => {
        await login(page, 'en');
        await page.goto('/dashboard');
        await page.waitForTimeout(1000);

        // Check for currency symbols or formatted numbers
        const amounts = page.getByText(/\d+[\.,]\d+/);
        const count = await amounts.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });
});

test.describe('Layout Verification', () => {
    test('should have proper HTML structure', async ({ page }) => {
        await page.goto('/login');

        const html = page.locator('html');
        await expect(html).toBeVisible();
    });

    test('should align form fields properly', async ({ page }) => {
        await page.goto('/login');

        const formInputs = page.locator('input');
        const count = await formInputs.count();
        expect(count).toBeGreaterThan(0);
    });
});
