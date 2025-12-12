import { Page, Locator } from '@playwright/test';

/**
 * Base page object class providing common functionality for all page objects
 */
export class BasePage {
    readonly page: Page;
    readonly url: string;

    constructor(page: Page, url = '/') {
        this.page = page;
        this.url = url;
    }

    /**
     * Navigate to the page
     */
    async goto(): Promise<void> {
        await this.page.goto(this.url);
    }

    /**
     * Wait for page to be fully loaded
     */
    async waitForLoad(): Promise<void> {
        await this.page.waitForLoadState('networkidle');
    }

    /**
     * Get page title
     */
    async getTitle(): Promise<string> {
        return await this.page.title();
    }

    /**
     * Wait for a specific locator to be visible
     */
    async waitForElement(locator: Locator): Promise<void> {
        await locator.waitFor({ state: 'visible' });
    }

    /**
     * Take a screenshot
     */
    async screenshot(name: string): Promise<void> {
        await this.page.screenshot({ path: `e2e-results/screenshots/${name}.png`, fullPage: true });
    }
}
