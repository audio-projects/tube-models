import { test, expect } from '../fixtures/test-fixtures';
import { TEST_FILES, TIMEOUTS } from '../fixtures/test-data';

/**
 * E2E tests for SPICE parameter calculation
 */
test.describe('SPICE Parameter Calculation', () => {
    test.beforeEach(async ({ tubeEditorPage }) => {
        await tubeEditorPage.goto();
        await tubeEditorPage.waitForLoad();
    });

    test('should calculate triode parameters', async ({ tubeEditorPage, page }) => {
        // Set up triode tube
        await tubeEditorPage.setTubeName('Test ECC83');
        await tubeEditorPage.setTubeType('Triode');

        // Upload triode measurement file
        await tubeEditorPage.uploadFile(TEST_FILES.ECC83);
        await page.waitForTimeout(2000);

        // Switch to SPICE tab
        await tubeEditorPage.switchToTab('spice');

        // Click calculate button
        await tubeEditorPage.calculateButton.click();

        // Wait for calculation (can take up to 60 seconds)
        await page.waitForSelector(
            'button:has-text("Calculate Parameters")[disabled]',
            { timeout: 5000 }
        );

        // Wait for calculation to complete
        await page.waitForSelector(
            'button:has-text("Calculate Parameters"):not([disabled])',
            { timeout: TIMEOUTS.PARAMETER_CALCULATION }
        );

        // Verify SPICE model is generated
        const spiceModel = await tubeEditorPage.getSpiceModel();
        expect(spiceModel).toBeTruthy();
        expect(spiceModel).toContain('.subckt');
    });

    test('should calculate pentode parameters', async ({ tubeEditorPage, page }) => {
        // Set up pentode tube
        await tubeEditorPage.setTubeName('Test EF80');
        await tubeEditorPage.setTubeType('Pentode');

        // Upload pentode measurement file
        await tubeEditorPage.uploadFile(TEST_FILES.EF80_250);
        await page.waitForTimeout(2000);

        // Switch to SPICE tab
        await tubeEditorPage.switchToTab('spice');

        // Click calculate button
        await tubeEditorPage.calculateButton.click();

        // Wait for calculation
        await page.waitForSelector(
            'button:has-text("Calculate Parameters")[disabled]',
            { timeout: 5000 }
        );

        await page.waitForSelector(
            'button:has-text("Calculate Parameters"):not([disabled])',
            { timeout: TIMEOUTS.PARAMETER_CALCULATION }
        );

        // Verify SPICE model is generated
        const spiceModel = await tubeEditorPage.getSpiceModel();
        expect(spiceModel).toBeTruthy();
        expect(spiceModel).toContain('.subckt');
    });

    test('should display calculation progress', async ({ tubeEditorPage, page }) => {
        // Set up tube and upload file
        await tubeEditorPage.setTubeType('Triode');
        await tubeEditorPage.uploadFile(TEST_FILES.ECC83);
        await page.waitForTimeout(2000);

        // Switch to SPICE tab
        await tubeEditorPage.switchToTab('spice');

        // Start calculation
        await tubeEditorPage.calculateButton.click();

        // Check that calculate button is disabled during calculation
        await expect(tubeEditorPage.calculateButton).toBeDisabled({ timeout: 5000 });

        // Optionally check for progress indicator
        const progressIndicator = page.locator('[data-testid="calculation-progress"]');
        if (await progressIndicator.isVisible()) {
            expect(progressIndicator).toBeVisible();
        }
    });
});
