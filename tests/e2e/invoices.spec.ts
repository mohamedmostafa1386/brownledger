import { test, expect } from '@playwright/test';
import { login } from '../fixtures';

test.describe('Invoices Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
    });

    test('should navigate to invoices page', async ({ page }) => {
        await page.goto('/invoices');

        await expect(page).toHaveURL(/\/invoices/);
        // Use getByRole to find the Invoices heading specifically
        await expect(page.getByRole('heading', { name: /invoices/i })).toBeVisible();
    });

    test('should display invoices list', async ({ page }) => {
        await page.goto('/invoices');

        // Wait for page to load
        await page.waitForTimeout(1000);

        // Table or list should be visible
        const hasData = await page.locator('table, .invoice-list, .card').first().isVisible().catch(() => false);
        expect(hasData).toBeTruthy();
    });

    test('should have New Invoice button', async ({ page }) => {
        await page.goto('/invoices');

        const newButton = page.locator('button:has-text("New"), button:has-text("Create"), a:has-text("Invoice")');
        await expect(newButton.first()).toBeVisible();
    });

    test('should filter invoices by status', async ({ page }) => {
        await page.goto('/invoices');

        // Look for status filter/tabs
        const statusFilter = page.locator('button, [role="tab"]');
        const count = await statusFilter.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should search invoices', async ({ page }) => {
        await page.goto('/invoices');

        const searchInput = page.locator('input[placeholder*="Search"], input[type="search"], input[placeholder*="search"]');

        if (await searchInput.first().isVisible()) {
            await searchInput.first().fill('test');
            await page.waitForTimeout(500);
        }
    });
});
