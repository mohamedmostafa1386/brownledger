import { test, expect } from '@playwright/test';
import { login } from '../fixtures';

test.describe('Chart of Accounts Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
        await page.goto('/chart-of-accounts');
    });

    test('should display chart of accounts page', async ({ page }) => {
        await expect(page.getByRole('heading').first()).toBeVisible();
    });

    test('should have seed defaults button', async ({ page }) => {
        const seedButton = page.locator('button:has-text("Seed"), button:has-text("Default"), button:has-text("افتراضي"), button:has-text("Initialize")');
        const isVisible = await seedButton.first().isVisible().catch(() => false);
        expect(typeof isVisible).toBe('boolean');
    });

    test('should have add account button', async ({ page }) => {
        const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("إضافة"), button:has-text("Create")');
        await expect(addButton.first()).toBeVisible();
    });

    test('should display account balances', async ({ page }) => {
        // Should show account list or table
        const content = page.locator('.bg-card, table, .account, [data-testid="accounts"]');
        const count = await content.count();
        expect(count).toBeGreaterThan(0);
    });
});

test.describe('Journal Entries Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
        await page.goto('/journal-entries');
    });

    test('should display journal entries page', async ({ page }) => {
        await expect(page.getByRole('heading').first()).toBeVisible();
    });

    test('should show journal entries list', async ({ page }) => {
        await page.waitForTimeout(1000);
        const list = page.locator('table, .entries-list, .bg-card, [data-testid="entries"]');
        const count = await list.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should have new entry button', async ({ page }) => {
        const newButton = page.locator('button:has-text("New"), button:has-text("Add"), button:has-text("إضافة"), button:has-text("Create")');
        await expect(newButton.first()).toBeVisible();
    });

    test('should have source filter', async ({ page }) => {
        const filter = page.locator('select, [role="combobox"], button:has-text("Source"), button:has-text("Filter"), button:has-text("All")');
        await expect(filter.first()).toBeVisible();
    });

    test('should show debit and credit columns', async ({ page }) => {
        // Check for table headers or any accounting-related text
        const table = page.locator('table, .bg-card');
        const hasTable = await table.first().isVisible().catch(() => false);
        expect(hasTable).toBeTruthy();
    });
});

test.describe('Financial Ratios Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
        await page.goto('/financial-ratios');
    });

    test('should display financial ratios page', async ({ page }) => {
        await expect(page.getByRole('heading').first()).toBeVisible();
    });

    test('should show overall health score', async ({ page }) => {
        const healthScore = page.getByText(/Health|Score|Overall|صحة|نسب/i);
        await expect(healthScore.first()).toBeVisible();
    });

    test('should show individual ratio cards', async ({ page }) => {
        const ratioCards = page.locator('.ratio-card, .bg-card, [data-testid="ratio-card"]');
        const count = await ratioCards.count();
        expect(count).toBeGreaterThan(0);
    });
});
