import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page object for the tube editor page (/tube/:id)
 */
export class TubeEditorPage extends BasePage {
    readonly tubeNameInput: Locator;
    readonly tubeTypeSelect: Locator;
    readonly uploadTab: Locator;
    readonly plotTab: Locator;
    readonly specificationsTab: Locator;
    readonly spiceTab: Locator;
    readonly fileInput: Locator;
    readonly uploadButton: Locator;
    readonly saveButton: Locator;
    readonly deleteButton: Locator;
    readonly backButton: Locator;
    readonly canvas: Locator;
    readonly calculateButton: Locator;
    readonly spiceModelTextarea: Locator;
    readonly downloadSpiceButton: Locator;

    constructor(page: Page, tubeId = 'new') {
        super(page, `/tube/${tubeId}`);
        this.tubeNameInput = page.locator('input[formControlName="name"]');
        this.tubeTypeSelect = page.locator('select[formControlName="type"]');
        this.uploadTab = page.locator('[data-testid="upload-tab"]');
        this.plotTab = page.locator('[data-testid="plot-tab"]');
        this.specificationsTab = page.locator('[data-testid="specifications-tab"]');
        this.spiceTab = page.locator('[data-testid="spice-tab"]');
        this.fileInput = page.locator('input[type="file"]');
        this.uploadButton = page.locator('button:has-text("Upload")');
        this.saveButton = page.locator('button:has-text("Save")');
        this.deleteButton = page.locator('button:has-text("Delete")');
        this.backButton = page.locator('button:has-text("Back")');
        this.canvas = page.locator('canvas');
        this.calculateButton = page.locator('button:has-text("Calculate Parameters")');
        this.spiceModelTextarea = page.locator('textarea[data-testid="spice-model"]');
        this.downloadSpiceButton = page.locator('button:has-text("Download SPICE Model")');
    }

    /**
     * Set the tube name
     */
    async setTubeName(name: string): Promise<void> {
        await this.tubeNameInput.fill(name);
    }

    /**
     * Set the tube type
     */
    async setTubeType(type: 'Triode' | 'Pentode' | 'Tetrode'): Promise<void> {
        await this.tubeTypeSelect.selectOption(type);
    }

    /**
     * Upload a measurement file
     */
    async uploadFile(filePath: string): Promise<void> {
        await this.fileInput.setInputFiles(filePath);
    }

    /**
     * Switch to a specific tab
     */
    async switchToTab(tab: 'upload' | 'plot' | 'specifications' | 'spice'): Promise<void> {
        const tabMap = {
            upload: this.uploadTab,
            plot: this.plotTab,
            specifications: this.specificationsTab,
            spice: this.spiceTab
        };
        await tabMap[tab].click();
    }

    /**
     * Calculate SPICE parameters
     */
    async calculateParameters(): Promise<void> {
        await this.calculateButton.click();
    }

    /**
     * Save the tube
     */
    async save(): Promise<void> {
        await this.saveButton.click();
    }

    /**
     * Delete the tube
     */
    async delete(): Promise<void> {
        await this.deleteButton.click();
    }

    /**
     * Go back to tube list
     */
    async goBack(): Promise<void> {
        await this.backButton.click();
    }

    /**
     * Check if plot is visible
     */
    async isPlotVisible(): Promise<boolean> {
        return await this.canvas.isVisible();
    }

    /**
     * Get SPICE model text
     */
    async getSpiceModel(): Promise<string> {
        return await this.spiceModelTextarea.inputValue();
    }

    /**
     * Download SPICE model
     */
    async downloadSpiceModel(): Promise<void> {
        await this.downloadSpiceButton.click();
    }
}
