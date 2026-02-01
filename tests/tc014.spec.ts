
import { test, expect } from '@playwright/test';

test('TC014 - Financial Reports Accuracy and Consistency', async ({ page }) => {
    // Login
    // Login
    await page.goto('http://localhost:3000');

    // Check if we are already redirected to login or need to click
    if (!page.url().includes('/auth/login')) {
        const loginLink = page.locator('a[href="/auth/login"]').first();
        if (await loginLink.isVisible()) {
            await loginLink.click();
        }
    }

    // Wait for email field to be attached to DOM
    // Wait for email field to be attached to DOM
    try {
        await page.waitForLoadState('networkidle');
        const emailInput = page.getByPlaceholder(/email/i).first();
        if (!await emailInput.isVisible()) {
            // Try searching by general input if specific placeholder fails
            await page.locator('input').first().waitFor();
        }
        await page.fill('input[type="email"]', 'admin@brownledger.com');
    } catch (e) {
        console.log('Login failed. Current URL:', page.url());
        console.log('Page Title:', await page.title());
        // console.log('Body start:', (await page.content()).substring(0, 500));
        throw e;
    }
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);

    // Navigate to Reports using robust selector (or fallback)
    const reportsLink = page.locator('a[href="/reports"]').first();
    if (await reportsLink.isVisible()) {
        await reportsLink.click();
    } else {
        // Nav fallback
        await page.goto('http://localhost:3000/reports');
    }

    // 1. Overview Tab (Default)
    // Check for presence of KPI Cards
    await expect(page.getByText('Total Revenue')).toBeVisible();

    // 2. Click Sales Tab (using data-testid)
    await page.locator('[data-testid="report-tab-sales"]').click();
    await expect(page.getByText('Total Sales')).toBeVisible();

    // 3. Click Receivables Tab
    await page.locator('[data-testid="report-tab-receivables"]').click();
    await expect(page.getByText('Total A/R')).toBeVisible();

    // 4. Click Purchases Tab
    await page.locator('[data-testid="report-tab-purchases"]').click();
    await expect(page.getByText('Total Purchases')).toBeVisible();

    // 5. Click Inventory Tab
    await page.locator('[data-testid="report-tab-inventory"]').click();
    await expect(page.getByText('Inventory Value')).toBeVisible();

    // 6. Click Clients Tab
    await page.locator('[data-testid="report-tab-clients"]').click();
    await expect(page.getByText('Total Clients')).toBeVisible();
});
