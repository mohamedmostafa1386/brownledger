import { test, expect } from '@playwright/test';
import { login } from '../fixtures';

test.describe('Reports View Localization', () => {

    test('should display Reports dashboard in English', async ({ page }) => {
        // 1. Login in English
        await login(page, 'en');

        // 2. Navigate to Dashboard with Analytics tab active
        await page.goto('/en/dashboard?tab=analytics');
        // networkidle is flaky with streaming/polling, use domcontentloaded + visibility checks instead
        await page.waitForLoadState('domcontentloaded');

        // 3. Verify Tab is active and shows "Reports"
        const reportsTab = page.getByRole('tab', { name: 'Reports' }); // "dashboard.reports"
        await expect(reportsTab).toBeVisible({ timeout: 10000 });
        await expect(reportsTab).toHaveAttribute('aria-selected', 'true');

        // 4. Verify Content Title (H2)
        // t("reports.title") -> "Analytics & Insights"
        await expect(page.getByRole('heading', { level: 2, name: 'Analytics & Insights' })).toBeVisible();

        // 5. Verify Sub-Tabs
        await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
        await expect(page.getByRole('tab', { name: 'Sales & Revenue' })).toBeVisible();
    });

    test('should display Reports dashboard in Arabic', async ({ page }) => {
        // 1. Login in Arabic
        await login(page, 'ar');

        // 2. Navigate to Dashboard with Analytics tab
        await page.goto('/ar/dashboard?tab=analytics');
        await page.waitForLoadState('domcontentloaded');

        // 3. Verify Tab is active and shows Arabic text "التحليلات والتقارير"
        const reportsTab = page.getByRole('tab', { name: 'التحليلات والتقارير' });
        await expect(reportsTab).toBeVisible({ timeout: 10000 });
        await expect(reportsTab).toHaveAttribute('aria-selected', 'true');

        // 4. Verify Content Title (H2) exists
        // We verify an H2 exists to ensure the component rendered
        await expect(page.getByRole('heading', { level: 2 })).toBeVisible();

        // 5. Verify Sub-Tabs in Arabic
        // matches t("reports.tabs.overview") -> "نظرة عامة"
        await expect(page.getByRole('tab', { name: 'نظرة عامة' })).toBeVisible();
    });

});
