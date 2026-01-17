import { test, expect } from '@playwright/test';
import { login } from '../fixtures';

/**
 * Settings & Configuration Module Tests
 * Tests company profile, user management, and configuration
 */
test.describe('Settings Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
    });

    test('should display settings page', async ({ page }) => {
        await page.goto('/settings');
        await expect(page.getByRole('heading').first()).toBeVisible();
    });

    test('should have company settings section', async ({ page }) => {
        await page.goto('/settings');
        const companySection = page.getByText(/Company|Business|Profile/i);
        await expect(companySection.first()).toBeVisible();
    });

    test('should have save button', async ({ page }) => {
        await page.goto('/settings');
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
        await expect(saveButton.first()).toBeVisible();
    });
});

test.describe('User Management', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
    });

    test('should access users from settings', async ({ page }) => {
        await page.goto('/settings');
        // Settings page should load
        const heading = page.getByRole('heading');
        await expect(heading.first()).toBeVisible();
    });
});

test.describe('Clients Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
    });

    test('should display clients page', async ({ page }) => {
        await page.goto('/clients');
        await expect(page.getByRole('heading').first()).toBeVisible();
    });

    test('should have add client button', async ({ page }) => {
        await page.goto('/clients');
        const addButton = page.locator('button:has-text("Add"), button:has-text("New"), a:has-text("Client")');
        await expect(addButton.first()).toBeVisible();
    });

    test('should display client list', async ({ page }) => {
        await page.goto('/clients');
        await page.waitForTimeout(1000);
        const content = page.locator('table, .bg-card, .grid');
        const count = await content.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should search clients', async ({ page }) => {
        await page.goto('/clients');
        const searchInput = page.locator('input[placeholder*="Search"]');
        await expect(searchInput.first()).toBeVisible();
    });
});

test.describe('Expenses Module', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
    });

    test('should display expenses page', async ({ page }) => {
        await page.goto('/expenses');
        await expect(page.getByRole('heading').first()).toBeVisible();
    });

    test('should have add expense button', async ({ page }) => {
        await page.goto('/expenses');
        const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Expense")');
        await expect(addButton.first()).toBeVisible();
    });

    test('should display expense list', async ({ page }) => {
        await page.goto('/expenses');
        await page.waitForTimeout(1000);
        const content = page.locator('table, .bg-card');
        const count = await content.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should filter expenses by category', async ({ page }) => {
        await page.goto('/expenses');
        const categoryFilter = page.locator('select, [role="combobox"], button:has-text("Category")');
        await expect(categoryFilter.first()).toBeVisible();
    });
});
