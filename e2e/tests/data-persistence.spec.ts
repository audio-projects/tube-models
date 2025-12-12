import { test, expect } from '../fixtures/test-fixtures';
import { TEST_FILES } from '../fixtures/test-data';
import { clearLocalStorage } from '../helpers/test-helpers';

/**
 * E2E tests for local storage persistence
 */
test.describe('Local Storage and Data Persistence', () => {
    test.beforeEach(async ({ page, tubeEditorPage }) => {
        // Clear local storage before each test
        await clearLocalStorage(page);
        await tubeEditorPage.goto();
        await tubeEditorPage.waitForLoad();
    });

    test('should save tube data to local storage', async ({ page, tubeEditorPage }) => {
        // Create a tube
        await tubeEditorPage.setTubeName('Test Local Storage Tube');
        await tubeEditorPage.setTubeType('Triode');
        await tubeEditorPage.uploadFile(TEST_FILES.ECC83);
        await page.waitForTimeout(2000);

        // Save the tube
        await tubeEditorPage.save();
        await page.waitForTimeout(1000);

        // Check local storage
        const tubesData = await page.evaluate(() => localStorage.getItem('tubes'));
        expect(tubesData).toBeTruthy();

        // Parse and verify
        const tubes = JSON.parse(tubesData!);
        expect(Array.isArray(tubes)).toBe(true);
        expect(tubes.length).toBeGreaterThan(0);
    });

    test('should restore tube data from local storage', async ({ page, tubeEditorPage, tubesListPage }) => {
        // Create and save a tube
        await tubeEditorPage.setTubeName('Persistent Tube');
        await tubeEditorPage.setTubeType('Triode');
        await tubeEditorPage.save();
        await page.waitForTimeout(1000);

        // Navigate away and back
        await tubesListPage.goto();
        await tubesListPage.waitForLoad();

        // Check tube appears in list
        await expect(tubesListPage.tubeCards).toHaveCount(1, { timeout: 5000 });
    });

    test('should persist tube after page reload', async ({ page, tubeEditorPage }) => {
        // Create and save a tube
        const tubeName = 'Reload Test Tube';
        await tubeEditorPage.setTubeName(tubeName);
        await tubeEditorPage.setTubeType('Triode');
        await tubeEditorPage.save();
        await page.waitForTimeout(1000);

        // Reload the page
        await page.reload();
        await tubeEditorPage.waitForLoad();

        // Verify tube name is still there
        await expect(tubeEditorPage.tubeNameInput).toHaveValue(tubeName);
    });
});
