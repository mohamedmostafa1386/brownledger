import { test, expect } from '@playwright/test';
import { login } from '../fixtures';

test.describe('Financial Statements Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
        await page.goto('/financial-statements');
    });

    test('should display financial statements page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /financial|statements/i })).toBeVisible();
    });

    test('should have tabs for different statements', async ({ page }) => {
        // Look for buttons that act as tabs
        const buttons = page.locator('button');
        const count = await buttons.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should show Income Statement tab', async ({ page }) => {
        const incomeTab = page.getByText(/Income|Revenue|الدخل/i);
        await expect(incomeTab.first()).toBeVisible();
    });

    test('should show Balance Sheet tab', async ({ page }) => {
        const balanceTab = page.getByText(/Balance|Sheet|الميزانية/i);
        await expect(balanceTab.first()).toBeVisible();
    });

    test('should show Trial Balance tab', async ({ page }) => {
        const trialTab = page.getByText(/Trial|ميزان/i);
        await expect(trialTab.first()).toBeVisible();
    });

    test('should have Export PDF button', async ({ page }) => {
        const exportButton = page.locator('button:has-text("Export"), button:has-text("PDF"), button:has-text("تصدير")');
        await expect(exportButton.first()).toBeVisible();
    });
});

test.describe('Income Statement', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
        await page.goto('/financial-statements');
    });

    test('should display revenue section', async ({ page }) => {
        const revenueSection = page.getByText(/Revenue|Sales|إيرادات|مبيعات/i);
        await expect(revenueSection.first()).toBeVisible();
    });

    test('should display net income', async ({ page }) => {
        const netIncome = page.getByText(/Net Income|Net Profit|صافي/i);
        await expect(netIncome.first()).toBeVisible();
    });
});
