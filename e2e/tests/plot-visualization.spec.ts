import { test, expect } from '../fixtures/test-fixtures';
import { TEST_FILES } from '../fixtures/test-data';
import { waitForChart } from '../helpers/test-helpers';

/**
 * E2E tests for plot visualization
 */
test.describe('Plot Visualization', () => {
    test.beforeEach(async ({ tubeEditorPage }) => {
        await tubeEditorPage.goto();
        await tubeEditorPage.waitForLoad();
    });

    test('should display plot after uploading triode data', async ({ tubeEditorPage, page }) => {
        // Upload triode file
        await tubeEditorPage.setTubeType('Triode');
        await tubeEditorPage.uploadFile(TEST_FILES.ECC83);
        await page.waitForTimeout(2000);

        // Switch to plot tab
        await tubeEditorPage.switchToTab('plot');

        // Wait for chart to render
        await waitForChart(page);

        // Verify canvas is visible
        await expect(tubeEditorPage.canvas).toBeVisible();

        // Check canvas has dimensions
        const canvasBox = await tubeEditorPage.canvas.boundingBox();
        expect(canvasBox).toBeTruthy();
        expect(canvasBox!.width).toBeGreaterThan(0);
        expect(canvasBox!.height).toBeGreaterThan(0);
    });

    test('should display plot after uploading pentode data', async ({ tubeEditorPage, page }) => {
        // Upload pentode file
        await tubeEditorPage.setTubeType('Pentode');
        await tubeEditorPage.uploadFile(TEST_FILES.EF80_250);
        await page.waitForTimeout(2000);

        // Switch to plot tab
        await tubeEditorPage.switchToTab('plot');

        // Wait for chart to render
        await waitForChart(page);

        // Verify canvas is visible
        await expect(tubeEditorPage.canvas).toBeVisible();
    });

    test('should update plot when switching measurement files', async ({ tubeEditorPage, page }) => {
        // Upload first file
        await tubeEditorPage.setTubeType('Triode');
        await tubeEditorPage.uploadFile(TEST_FILES.ECC83);
        await page.waitForTimeout(2000);

        // Check plot
        await tubeEditorPage.switchToTab('plot');
        await waitForChart(page);
        await expect(tubeEditorPage.canvas).toBeVisible();

        // Upload different file
        await tubeEditorPage.switchToTab('upload');
        await tubeEditorPage.uploadFile(TEST_FILES.ECC81);
        await page.waitForTimeout(2000);

        // Check plot updated
        await tubeEditorPage.switchToTab('plot');
        await waitForChart(page);
        await expect(tubeEditorPage.canvas).toBeVisible();
    });

    test('should handle plot interactions', async ({ tubeEditorPage, page }) => {
        // Upload file and show plot
        await tubeEditorPage.uploadFile(TEST_FILES.ECC83);
        await page.waitForTimeout(2000);
        await tubeEditorPage.switchToTab('plot');
        await waitForChart(page);

        // Get canvas element
        const canvas = tubeEditorPage.canvas;
        await expect(canvas).toBeVisible();

        // Hover over canvas (Chart.js should show tooltip)
        await canvas.hover();

        // Could add more specific interactions if tooltips or zoom are implemented
    });
});
