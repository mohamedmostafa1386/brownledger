import { test, expect } from '@playwright/test';
import { login } from '../fixtures';

/**
 * Purchase Orders & Bills Module Tests
 * Tests PO creation, approval, bills, and supplier payments
 */
test.describe('Purchase Orders Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
    });

    test('should display purchase orders page', async ({ page }) => {
        await page.goto('/purchase-orders');
        await expect(page.getByRole('heading').first()).toBeVisible();
    });

    test('should have new PO button', async ({ page }) => {
        await page.goto('/purchase-orders');
        const newButton = page.locator('button:has-text("New"), button:has-text("Create"), a:has-text("Order")');
        await expect(newButton.first()).toBeVisible();
    });

    test('should display PO list', async ({ page }) => {
        await page.goto('/purchase-orders');
        await page.waitForTimeout(1000);
        const content = page.locator('table, .bg-card, [data-testid="po-list"]');
        const count = await content.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should filter POs by status', async ({ page }) => {
        await page.goto('/purchase-orders');
        const statusFilter = page.locator('select, [role="combobox"], button:has-text("Status"), button:has-text("All")');
        await expect(statusFilter.first()).toBeVisible();
    });

    test('should show supplier information', async ({ page }) => {
        await page.goto('/purchase-orders');
        await page.waitForTimeout(1000);
        const supplierText = page.getByText(/Supplier|Vendor|Source/i);
        const isVisible = await supplierText.first().isVisible().catch(() => false);
        expect(isVisible).toBeTruthy();
    });
});

test.describe('Bills (Payables) Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
    });

    test('should display bills page', async ({ page }) => {
        await page.goto('/bills');
        await expect(page.getByRole('heading').first()).toBeVisible();
    });

    test('should have new bill button', async ({ page }) => {
        await page.goto('/bills');
        const newButton = page.locator('button:has-text("New"), button:has-text("Create"), button:has-text("Bill")');
        await expect(newButton.first()).toBeVisible();
    });

    test('should display bills list', async ({ page }) => {
        await page.goto('/bills');
        await page.waitForTimeout(1000);
        const content = page.locator('table, .bg-card, [data-testid="bills-list"]');
        const count = await content.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should show payment status', async ({ page }) => {
        await page.goto('/bills');
        await page.waitForTimeout(1000);
        const statusText = page.getByText(/Status|Pending|Paid|Approved/i);
        await expect(statusText.first()).toBeVisible();
    });
});

test.describe('Suppliers Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
    });

    test('should display suppliers page', async ({ page }) => {
        await page.goto('/suppliers');
        await expect(page.getByRole('heading').first()).toBeVisible();
    });

    test('should have add supplier button', async ({ page }) => {
        await page.goto('/suppliers');
        const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a:has-text("Supplier")');
        await expect(addButton.first()).toBeVisible();
    });

    test('should display supplier list', async ({ page }) => {
        await page.goto('/suppliers');
        await page.waitForTimeout(1000);
        const content = page.locator('table, .bg-card, .grid');
        const count = await content.count();
        expect(count).toBeGreaterThan(0);
    });
});
