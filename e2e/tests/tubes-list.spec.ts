import { test, expect } from '../fixtures/test-fixtures';

/**
 * E2E tests for the tubes list page
 */
test.describe('Tubes List Page', () => {
    test.beforeEach(async ({ tubesListPage }) => {
        await tubesListPage.goto();
        await tubesListPage.waitForLoad();
    });

    test('should display the page title', async ({ page }) => {
        const title = await page.title();
        expect(title).toContain('TubeModels');
    });

    test('should load and display the tubes list', async ({ tubesListPage }) => {
        // Wait for tube cards to be visible
        await expect(tubesListPage.tubeCards.first()).toBeVisible({ timeout: 10000 });

        // Check that at least some tubes are displayed
        const tubeCount = await tubesListPage.getTubeCount();
        expect(tubeCount).toBeGreaterThan(0);
    });

    test('should navigate to tube editor when clicking on a tube card', async ({ page, tubesListPage }) => {
        // Wait for tubes to load
        await expect(tubesListPage.tubeCards.first()).toBeVisible({ timeout: 10000 });

        // Click the first tube card
        await tubesListPage.clickTubeCard(0);

        // Wait for navigation
        await page.waitForURL(/\/tube\/[^/]+$/);

        // Check we're on the tube editor page
        expect(page.url()).toMatch(/\/tube\/[^/]+$/);
    });

    test('should filter tubes when searching', async ({ tubesListPage }) => {
        // Wait for tubes to load
        await expect(tubesListPage.tubeCards.first()).toBeVisible({ timeout: 10000 });

        const initialCount = await tubesListPage.getTubeCount();

        // Search for specific tube
        await tubesListPage.searchTubes('ECC83');

        // Wait for filtering to apply
        await tubesListPage.page.waitForTimeout(500);

        const filteredCount = await tubesListPage.getTubeCount();

        // Filtered results should be less than or equal to initial
        expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });

    test('should display create new tube button', async ({ tubesListPage }) => {
        await expect(tubesListPage.createButton).toBeVisible();
    });

    test('should navigate to new tube editor when clicking create button', async ({ page, tubesListPage }) => {
        await tubesListPage.clickCreateNewTube();

        // Wait for navigation to new tube page
        await page.waitForURL(/\/tube\/new$/);

        expect(page.url()).toContain('/tube/new');
    });
});
