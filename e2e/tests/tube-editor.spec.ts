import { test, expect } from '../fixtures/test-fixtures';
import { TEST_FILES } from '../fixtures/test-data';

/**
 * E2E tests for the tube editor page
 */
test.describe('Tube Editor Page', () => {
    test.beforeEach(async ({ tubeEditorPage }) => {
        await tubeEditorPage.goto();
        await tubeEditorPage.waitForLoad();
    });

    test('should display the tube editor form', async ({ tubeEditorPage }) => {
        await expect(tubeEditorPage.tubeNameInput).toBeVisible();
        await expect(tubeEditorPage.tubeTypeSelect).toBeVisible();
    });

    test('should display all tabs', async ({ tubeEditorPage }) => {
        await expect(tubeEditorPage.uploadTab).toBeVisible();
        await expect(tubeEditorPage.plotTab).toBeVisible();
        await expect(tubeEditorPage.specificationsTab).toBeVisible();
        await expect(tubeEditorPage.spiceTab).toBeVisible();
    });

    test('should allow setting tube name and type', async ({ tubeEditorPage }) => {
        // Set tube name
        await tubeEditorPage.setTubeName('Test Tube ECC83');
        await expect(tubeEditorPage.tubeNameInput).toHaveValue('Test Tube ECC83');

        // Set tube type
        await tubeEditorPage.setTubeType('Triode');
        await expect(tubeEditorPage.tubeTypeSelect).toHaveValue('Triode');
    });

    test('should upload a measurement file', async ({ tubeEditorPage, page }) => {
        // Upload file
        await tubeEditorPage.uploadFile(TEST_FILES.ECC83);

        // Wait for file processing
        await page.waitForTimeout(1000);

        // Verify upload success (could check for success toast or plot data)
        await tubeEditorPage.switchToTab('plot');
        const isPlotVisible = await tubeEditorPage.isPlotVisible();
        expect(isPlotVisible).toBe(true);
    });

    test('should switch between tabs', async ({ tubeEditorPage }) => {
        // Test switching to each tab
        await tubeEditorPage.switchToTab('plot');
        await expect(tubeEditorPage.plotTab).toHaveAttribute('aria-selected', 'true');

        await tubeEditorPage.switchToTab('specifications');
        await expect(tubeEditorPage.specificationsTab).toHaveAttribute('aria-selected', 'true');

        await tubeEditorPage.switchToTab('spice');
        await expect(tubeEditorPage.spiceTab).toHaveAttribute('aria-selected', 'true');

        await tubeEditorPage.switchToTab('upload');
        await expect(tubeEditorPage.uploadTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should display plot after file upload', async ({ tubeEditorPage, page }) => {
        // Upload file
        await tubeEditorPage.uploadFile(TEST_FILES.ECC83);
        await page.waitForTimeout(1000);

        // Switch to plot tab
        await tubeEditorPage.switchToTab('plot');

        // Check canvas is visible
        await expect(tubeEditorPage.canvas).toBeVisible();
    });

    test('should navigate back to tubes list', async ({ page, tubeEditorPage }) => {
        await tubeEditorPage.goBack();

        // Wait for navigation
        await page.waitForURL(/\/tube$/);

        expect(page.url()).toContain('/tube');
        expect(page.url()).not.toContain('/tube/new');
    });
});
