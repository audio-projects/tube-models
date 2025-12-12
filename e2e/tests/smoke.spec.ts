import { test, expect } from '../fixtures/test-fixtures';

/**
 * E2E smoke tests for critical application functionality
 */
test.describe('Smoke Tests', () => {
    test('application loads successfully', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Check page is loaded
        const title = await page.title();
        expect(title).toBeTruthy();
        expect(title).toContain('TubeModels');
    });

    test('routing works correctly', async ({ page }) => {
        // Navigate to tubes list
        await page.goto('/tube');
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain('/tube');

        // Navigate to new tube editor
        await page.goto('/tube/new');
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain('/tube/new');
    });

    test('no console errors on page load', async ({ page }) => {
        const consoleErrors: string[] = [];

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        await page.goto('/tube');
        await page.waitForLoadState('networkidle');

        // Filter out known acceptable errors (like favicon 404s)
        const criticalErrors = consoleErrors.filter(
            error => !error.includes('favicon') && !error.includes('404')
        );

        expect(criticalErrors).toHaveLength(0);
    });

    test('main navigation elements are visible', async ({ page }) => {
        await page.goto('/tube');
        await page.waitForLoadState('networkidle');

        // Check for key UI elements
        const header = page.locator('header, nav, .navbar');
        await expect(header).toBeVisible({ timeout: 10000 });
    });

    test('responsive layout on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/tube');
        await page.waitForLoadState('networkidle');

        // Page should load without errors
        const title = await page.title();
        expect(title).toBeTruthy();
    });

    test('responsive layout on tablet viewport', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/tube');
        await page.waitForLoadState('networkidle');

        // Page should load without errors
        const title = await page.title();
        expect(title).toBeTruthy();
    });

    test('responsive layout on desktop viewport', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto('/tube');
        await page.waitForLoadState('networkidle');

        // Page should load without errors
        const title = await page.title();
        expect(title).toBeTruthy();
    });
});
