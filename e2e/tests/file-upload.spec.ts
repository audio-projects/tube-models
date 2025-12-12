import { test, expect } from '../fixtures/test-fixtures';
import { TEST_FILES } from '../fixtures/test-data';

/**
 * E2E tests for file upload functionality
 */
test.describe('File Upload', () => {
    test.beforeEach(async ({ tubeEditorPage }) => {
        await tubeEditorPage.goto();
        await tubeEditorPage.waitForLoad();
    });

    test('should upload triode measurement file', async ({ tubeEditorPage, page }) => {
        // Set tube type to Triode
        await tubeEditorPage.setTubeType('Triode');

        // Upload triode file
        await tubeEditorPage.uploadFile(TEST_FILES.ECC83);
        await page.waitForTimeout(2000);

        // Verify plot is displayed
        await tubeEditorPage.switchToTab('plot');
        const isPlotVisible = await tubeEditorPage.isPlotVisible();
        expect(isPlotVisible).toBe(true);
    });

    test('should upload pentode measurement file', async ({ tubeEditorPage, page }) => {
        // Set tube type to Pentode
        await tubeEditorPage.setTubeType('Pentode');

        // Upload pentode file
        await tubeEditorPage.uploadFile(TEST_FILES.EF80_250);
        await page.waitForTimeout(2000);

        // Verify plot is displayed
        await tubeEditorPage.switchToTab('plot');
        const isPlotVisible = await tubeEditorPage.isPlotVisible();
        expect(isPlotVisible).toBe(true);
    });

    test('should handle multiple file types', async ({ tubeEditorPage, page }) => {
        const testFiles = [
            TEST_FILES.ECC81,
            TEST_FILES.ECC82,
            TEST_FILES.PF86_TRIODE,
        ];

        for (const file of testFiles) {
            // Upload file
            await tubeEditorPage.uploadFile(file);
            await page.waitForTimeout(1000);

            // Check plot is visible
            await tubeEditorPage.switchToTab('plot');
            const isPlotVisible = await tubeEditorPage.isPlotVisible();
            expect(isPlotVisible).toBe(true);

            // Go back to upload tab for next iteration
            await tubeEditorPage.switchToTab('upload');
        }
    });
});
