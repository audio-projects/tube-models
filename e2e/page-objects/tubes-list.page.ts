import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Page object for the tubes list page (/tube)
 */
export class TubesListPage extends BasePage {
    readonly searchInput: Locator;
    readonly tubeCards: Locator;
    readonly createButton: Locator;
    readonly signInButton: Locator;
    readonly userMenu: Locator;

    constructor(page: Page) {
        super(page, '/tube');
        this.searchInput = page.locator('input[placeholder*="Search"]');
        this.tubeCards = page.locator('.card[data-testid="tube-card"]');
        this.createButton = page.locator('button:has-text("Create New Tube")');
        this.signInButton = page.locator('button:has-text("Sign In")');
        this.userMenu = page.locator('[data-testid="user-menu"]');
    }

    /**
     * Search for tubes by name
     */
    async searchTubes(query: string): Promise<void> {
        await this.searchInput.fill(query);
    }

    /**
     * Get the count of visible tube cards
     */
    async getTubeCount(): Promise<number> {
        return await this.tubeCards.count();
    }

    /**
     * Click on a tube card by index
     */
    async clickTubeCard(index: number): Promise<void> {
        await this.tubeCards.nth(index).click();
    }

    /**
     * Click on a tube card by name
     */
    async clickTubeByName(name: string): Promise<void> {
        await this.page.locator(`.card:has-text("${name}")`).click();
    }

    /**
     * Create a new tube
     */
    async clickCreateNewTube(): Promise<void> {
        await this.createButton.click();
    }

    /**
     * Sign in using Google
     */
    async signIn(): Promise<void> {
        await this.signInButton.click();
    }

    /**
     * Check if user is signed in
     */
    async isSignedIn(): Promise<boolean> {
        return await this.userMenu.isVisible();
    }
}
