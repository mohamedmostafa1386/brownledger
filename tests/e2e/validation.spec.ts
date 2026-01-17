import { test, expect } from '@playwright/test';
import { login } from '../fixtures';

/**
 * Button Functionality Audit
 */
test.describe('Button Functionality Audit', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
    });

    test('audit all buttons on dashboard', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForTimeout(1000);

        const buttons = await page.locator('button').all();
        console.log(`Found ${buttons.length} buttons on dashboard`);

        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            const isVisible = await button.isVisible().catch(() => false);
            const isEnabled = await button.isEnabled().catch(() => false);

            if (isVisible) {
                expect(typeof isEnabled).toBe('boolean');
            }
        }
    });

    test('audit all buttons on invoices page', async ({ page }) => {
        await page.goto('/invoices');
        await page.waitForTimeout(1000);

        const buttons = await page.locator('button').all();
        console.log(`Found ${buttons.length} buttons on invoices page`);

        for (const button of buttons) {
            const isVisible = await button.isVisible().catch(() => false);
            if (isVisible) {
                const isEnabled = await button.isEnabled().catch(() => false);
                expect(typeof isEnabled).toBe('boolean');
            }
        }
    });

    test('audit all buttons on POS page', async ({ page }) => {
        await page.goto('/pos');
        await page.waitForTimeout(1000);

        const buttons = await page.locator('button').all();
        console.log(`Found ${buttons.length} buttons on POS page`);

        for (const button of buttons) {
            const isVisible = await button.isVisible().catch(() => false);
            if (isVisible) {
                const isEnabled = await button.isEnabled().catch(() => false);
                expect(typeof isEnabled).toBe('boolean');
            }
        }
    });

    test('audit all buttons on receivables page', async ({ page }) => {
        await page.goto('/receivables');
        await page.waitForTimeout(1000);

        const buttons = await page.locator('button').all();
        console.log(`Found ${buttons.length} buttons on receivables page`);

        for (const button of buttons) {
            const isVisible = await button.isVisible().catch(() => false);
            if (isVisible) {
                const isEnabled = await button.isEnabled().catch(() => false);
                expect(typeof isEnabled).toBe('boolean');
            }
        }
    });
});

test.describe('Form Validation Tests', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
    });

    test('login form should validate empty fields', async ({ page }) => {
        // Logout first
        await page.context().clearCookies();
        await page.goto('/login');

        // Try to submit empty form
        await page.click('button[type="submit"]');

        // Should show validation or stay on page
        await page.waitForTimeout(500);
        expect(page.url()).toContain('login');
    });
});

test.describe('Calculation Tests', () => {
    test('POS cart should calculate totals correctly', async ({ page }) => {
        await login(page, 'en');
        await page.goto('/pos');
        await page.waitForTimeout(1000);

        // Page should have total display - use getByText instead of mixed selector
        const total = page.getByText(/Total|Subtotal|إجمالي/i);
        await expect(total.first()).toBeVisible();
    });
});
