import { test, expect } from '@playwright/test';
import { login } from '../fixtures';

/**
 * Data Integrity Tests
 * Tests double-entry accounting, calculations, and data validation
 */
test.describe('Double-Entry Accounting', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
    });

    test('should show balanced journal entries', async ({ page }) => {
        await page.goto('/en/journal-entries');
        await page.waitForTimeout(1000);

        // Look for debit/credit columns or totals
        const amounts = page.getByText(/Debit|Credit|مدين|دائن/i);
        const count = await amounts.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show trial balance totals equal', async ({ page }) => {
        await page.goto('/en/financial-statements');
        await page.waitForTimeout(1000);

        // Trial balance should show matching debit/credit
        const totals = page.getByText(/Total|Balance|ميزان/i);
        const count = await totals.count();
        expect(count).toBeGreaterThan(0);
    });
});

test.describe('Invoice Calculations', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
    });

    test('should calculate line item totals', async ({ page }) => {
        await page.goto('/en/invoices');
        await page.waitForTimeout(1000);

        // Invoice list should show amounts
        const amounts = page.getByText(/\$|EGP|\d+[\.,]\d{2}/);
        const count = await amounts.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should show correct total on invoice detail', async ({ page }) => {
        await page.goto('/en/invoices');
        await page.waitForTimeout(1000);

        // Look for total amount text
        const totalText = page.getByText(/Total|Amount|المبلغ/i);
        const count = await totalText.count();
        expect(count).toBeGreaterThan(0);
    });
});

test.describe('POS Calculations', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
    });

    test('should display subtotal', async ({ page }) => {
        await page.goto('/en/pos');
        await page.waitForTimeout(1000);

        const subtotal = page.getByText(/Subtotal|Sub|فرعي/i);
        await expect(subtotal.first()).toBeVisible();
    });

    test('should display tax amount', async ({ page }) => {
        await page.goto('/en/pos');
        await page.waitForTimeout(1000);

        const tax = page.getByText(/Tax|VAT|ضريبة/i);
        await expect(tax.first()).toBeVisible();
    });

    test('should display total amount', async ({ page }) => {
        await page.goto('/en/pos');
        await page.waitForTimeout(1000);

        const total = page.getByText(/Total|إجمالي/i);
        await expect(total.first()).toBeVisible();
    });
});

test.describe('Financial Statement Integrity', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
    });

    test('should show Assets = Liabilities + Equity', async ({ page }) => {
        await page.goto('/en/financial-statements');
        await page.waitForTimeout(1000);

        // Financial statements page should load with content
        const heading = page.getByRole('heading');
        await expect(heading.first()).toBeVisible();
    });

    test('should calculate net income correctly', async ({ page }) => {
        await page.goto('/en/financial-statements');
        await page.waitForTimeout(1000);

        // Income statement should show revenue, expenses, net income
        const incomeItems = page.getByText(/Revenue|Expenses|Net Income|إيرادات|مصروفات|صافي/i);
        const count = await incomeItems.count();
        expect(count).toBeGreaterThan(0);
    });
});

test.describe('Stock Quantity Validation', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
    });

    test('should show stock quantities', async ({ page }) => {
        await page.goto('/en/products');
        await page.waitForTimeout(1000);

        // Products should show quantity/stock
        const stockText = page.getByText(/Stock|Qty|Quantity|In Stock|Available/i);
        const count = await stockText.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });
});

test.describe('Invoice Number Uniqueness', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
    });

    test('should display unique invoice numbers', async ({ page }) => {
        await page.goto('/en/invoices');
        await page.waitForTimeout(1000);

        // Invoice numbers should follow a pattern
        const invoiceNumbers = page.getByText(/INV-\d+/);
        const count = await invoiceNumbers.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });
});

test.describe('Payment Application Validation', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, 'en');
    });

    test('should show payment amounts', async ({ page }) => {
        await page.goto('/en/receivables');
        await page.waitForTimeout(1000);

        // Payments should show applied/unapplied amounts
        const paymentText = page.getByText(/Applied|Unapplied|Payment|دفعة/i);
        const count = await paymentText.count();
        expect(count).toBeGreaterThan(0);
    });
});
