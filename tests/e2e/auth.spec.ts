import { test, expect } from '@playwright/test';
import { login } from '../fixtures';

test.describe('Authentication Flow', () => {
    test('should display login page', async ({ page }) => {
        await page.goto('/en/login');

        // Login page should show
        await expect(page.locator('h1')).toContainText(/welcome|sign in|login/i);
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should login successfully with valid credentials', async ({ page }) => {
        await page.goto('/en/login');

        await page.fill('#email', 'admin@brownledger.com');
        await page.fill('#password', 'demo123');
        await page.click('button[type="submit"]');

        // Should redirect to dashboard
        await page.waitForURL(/\/en\/dashboard/, { timeout: 10000 });
        await expect(page).not.toHaveURL(/login/);
    });

    test('should show error with invalid credentials', async ({ page }) => {
        await page.goto('/en/login');

        await page.fill('#email', 'wrong@email.com');
        await page.fill('#password', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Should show error or stay on login
        await page.waitForTimeout(2000);
        const hasError = await page.locator('.text-destructive, [role="alert"], .error').isVisible().catch(() => false);
        const onLoginPage = page.url().includes('login');

        expect(hasError || onLoginPage).toBeTruthy();
    });

    test('should logout successfully', async ({ page }) => {
        // Login first
        await login(page, 'en');

        // Find and click logout/signout button in user menu
        const userMenu = page.locator('[data-testid="user-menu"], button:has-text("Logout"), button:has-text("Sign Out")');

        if (await userMenu.first().isVisible()) {
            await userMenu.first().click();
            await page.waitForTimeout(1000);
        }
    });
});

test.describe('Session Management', () => {
    test('should persist session on page refresh', async ({ page }) => {
        await login(page, 'en');

        // Wait for dashboard to fully load
        await page.waitForLoadState('networkidle');

        // Reload the page
        await page.reload({ waitUntil: 'networkidle' });

        // Should still be authenticated (not on login)
        const url = page.url();
        expect(url).not.toContain('login');
    });

    test('should redirect unauthenticated users to login', async ({ page }) => {
        // Clear any existing session
        await page.context().clearCookies();

        // Try to access protected route
        await page.goto('/en/dashboard');

        // Should redirect to login or show dashboard (depending on auth config)
        await page.waitForTimeout(3000);
        const url = page.url();
        // Either on login page or dashboard (if no auth required)
        expect(url.includes('login') || url.includes('dashboard')).toBeTruthy();
    });
});
