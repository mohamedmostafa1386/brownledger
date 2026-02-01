import { test, expect } from '@playwright/test';
import { login } from '../fixtures';

test.describe('POS Module', () => {
    test.setTimeout(60000);
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
        await page.goto('/en/pos');
    });

    test('should display POS page', async ({ page }) => {
        // Should have POS or Point of Sale heading somewhere on page
        await expect(page.getByRole('heading').first()).toBeVisible();
    });

    test('should show products grid', async ({ page }) => {
        // Should have product cards or grid
        await page.waitForTimeout(1000);
        const content = page.locator('.product, .grid, .bg-card, [data-testid="product"]');
        const count = await content.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should show cart section', async ({ page }) => {
        // Cart should be visible - check for cart-related text or elements
        const cart = page.getByText(/Cart|Sale|Current|Total|Subtotal|سلة|إجمالي/i);
        await expect(cart.first()).toBeVisible();
    });

    test('should have checkout button', async ({ page }) => {
        const checkoutButton = page.locator('button:has-text("Checkout"), button:has-text("Pay"), button:has-text("Complete"), button:has-text("دفع")');
        await expect(checkoutButton.first()).toBeVisible();
    });

    test('should have clear cart button', async ({ page }) => {
        const clearButton = page.locator('button:has-text("Clear"), button:has-text("Empty"), button:has-text("مسح"), button:has-text("New Sale")');
        await expect(clearButton.first()).toBeVisible();
    });

    test('should have search input', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="Barcode"], input[placeholder*="scan"], input[placeholder*="بحث"], input[placeholder*="Product"]');
        await expect(searchInput.first()).toBeVisible();
    });

    test('should show payment section', async ({ page }) => {
        // Check for payment-related elements
        const paymentSection = page.locator('text=/Cash|Card|Payment|نقد|بطاقة/i');
        const isVisible = await paymentSection.first().isVisible().catch(() => false);

        // Either payment section visible or checkout button exists
        const checkoutButton = page.locator('button:has-text("Checkout"), button:has-text("Pay")');
        const checkoutVisible = await checkoutButton.first().isVisible().catch(() => false);

        expect(isVisible || checkoutVisible).toBeTruthy();
    });
});
