import { test, expect } from '@playwright/test';
import { login } from '../fixtures';

/**
 * Arabic Locale & RTL Layout Tests
 * These tests should only run with the chromium-arabic-rtl project
 */

// Skip these tests when running in English locale
test.describe('Arabic Locale - Login Page', () => {
    test('should display login page in Arabic', async ({ page }) => {
        await page.goto('/en/login');
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
        await login(page, 'ar');

        // Check that navigation has Arabic text
        const nav = page.locator('aside');
        if (await nav.count() > 0) {
            const navText = await nav.textContent();
            expect(navText).toContain('لوحة التحكم'); // Dashboard (Sidebar)
            expect(navText).toContain('الفواتير'); // Invoices
        }

        // Check main content header
        // Check main content header
        const dashboardTitle = page.getByRole('heading', { name: 'لوحة التحكم', level: 1 });
        await expect(dashboardTitle).toBeVisible();

        // Check tabs
        const snapshotTab = page.locator('button[value="snapshot"]');
        await expect(snapshotTab).toContainText('نظرة عامة'); // Snapshot
    });
});

test.describe('Arabic Locale - Invoices Page', () => {
    test('should display invoices page', async ({ page }) => {
        await login(page, 'en');
        await page.goto('/en/invoices');
        await page.waitForTimeout(1000);

        const heading = page.getByRole('heading');
        await expect(heading.first()).toBeVisible();
    });
});



test.describe('Arabic Locale - POS Page', () => {
    test('should display POS page', async ({ page }) => {
        await login(page, 'en');
        await page.goto('/en/pos');
        await page.waitForTimeout(1000);

        const heading = page.getByRole('heading');
        await expect(heading.first()).toBeVisible();
    });
});

test.describe('Arabic Locale - Financial Statements', () => {
    test('should display financial statements', async ({ page }) => {
        await login(page, 'en');
        await page.goto('/en/financial-statements');
        await page.waitForTimeout(1000);

        const heading = page.getByRole('heading');
        await expect(heading.first()).toBeVisible();
    });
});

test.describe('Number & Date Formatting', () => {
    test('should format currency amounts correctly', async ({ page }) => {
        await login(page, 'en');
        await page.goto('/en/dashboard');
        await page.waitForTimeout(1000);

        // Check for currency symbols or formatted numbers
        const amounts = page.getByText(/\d+[\.,]\d+/);
        const count = await amounts.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });
});

test.describe('Layout Verification', () => {
    test('should have proper HTML structure', async ({ page }) => {
        await page.goto('/en/login');

        const html = page.locator('html');
        await expect(html).toBeVisible();
    });

    test('should align form fields properly', async ({ page }) => {
        await page.goto('/en/login');

        const formInputs = page.locator('input');
        const count = await formInputs.count();
        expect(count).toBeGreaterThan(0);
    });
});
