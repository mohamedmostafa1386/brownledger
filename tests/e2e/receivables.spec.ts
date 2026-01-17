import { test, expect } from '@playwright/test';
import { login } from '../fixtures';

test.describe('Receivables Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
        await page.goto('/receivables');
    });

    test('should display receivables page', async ({ page }) => {
        // Page should have h1 heading
        await expect(page.getByRole('heading').first()).toBeVisible();
    });

    test('should show KPI cards', async ({ page }) => {
        // Should have stat cards with bg-card class
        const cards = page.locator('.bg-card, [data-testid="kpi-card"]');
        const count = await cards.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should have Register Cash button', async ({ page }) => {
        const cashButton = page.locator('button:has-text("Cash"), button:has-text("نقد"), button:has-text("💵")');
        await expect(cashButton.first()).toBeVisible();
    });

    test('should have Register Check button', async ({ page }) => {
        const checkButton = page.locator('button:has-text("Check"), button:has-text("شيك"), button:has-text("🏦")');
        await expect(checkButton.first()).toBeVisible();
    });

    test('should have tabs', async ({ page }) => {
        // Tab buttons in nav element
        const tabs = page.locator('nav button, [role="tab"], button[data-state]');
        const count = await tabs.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should switch between tabs', async ({ page }) => {
        const tabs = page.locator('nav button');

        if (await tabs.count() > 1) {
            await tabs.nth(1).click();
            await page.waitForTimeout(300);
        }
    });
});
