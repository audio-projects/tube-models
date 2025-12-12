import { Page } from '@playwright/test';

/**
 * Helper functions for e2e tests
 */

/**
 * Wait for Angular to be stable
 */
export async function waitForAngular(page: Page): Promise<void> {
    await page.waitForFunction(() => {
        const ngZone = (window as Window & { ng?: { getInjector?: () => { get: (name: string) => { isStable: boolean } } } }).ng?.getInjector?.()?.get('NgZone');
        return !ngZone || ngZone.isStable;
    });
}

/**
 * Clear local storage
 */
export async function clearLocalStorage(page: Page): Promise<void> {
    await page.evaluate(() => localStorage.clear());
}

/**
 * Clear session storage
 */
export async function clearSessionStorage(page: Page): Promise<void> {
    await page.evaluate(() => sessionStorage.clear());
}

/**
 * Get local storage item
 */
export async function getLocalStorageItem(page: Page, key: string): Promise<string | null> {
    return await page.evaluate((key) => localStorage.getItem(key), key);
}

/**
 * Set local storage item
 */
export async function setLocalStorageItem(page: Page, key: string, value: string): Promise<void> {
    await page.evaluate(
        ({ key, value }) => localStorage.setItem(key, value),
        { key, value }
    );
}

/**
 * Wait for a file download and return the path
 */
export async function waitForDownload(page: Page, action: () => Promise<void>): Promise<string> {
    const downloadPromise = page.waitForEvent('download');
    await action();
    const download = await downloadPromise;
    return await download.path() || '';
}

/**
 * Mock console errors
 */
export async function captureConsoleErrors(page: Page): Promise<string[]> {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });
    return errors;
}

/**
 * Wait for chart to render
 */
export async function waitForChart(page: Page): Promise<void> {
    await page.waitForFunction(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            return false;
        }
        const ctx = canvas.getContext('2d');
        return ctx !== null;
    });
}

/**
 * Get chart data points count
 */
export async function getChartDataPointsCount(page: Page): Promise<number> {
    return await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            return 0;
        }
        // Access Chart.js instance
        const chart = (canvas as HTMLCanvasElement & { chart?: { data?: { datasets?: { data?: unknown[] }[] } } }).chart;
        if (!chart || !chart.data || !chart.data.datasets) {
            return 0;
        }
        return chart.data.datasets.reduce((sum: number, dataset: { data?: unknown[] }) => {
            return sum + (dataset.data?.length || 0);
        }, 0);
    });
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, text?: string): Promise<void> {
    const selector = text
        ? `.toast:has-text("${text}")`
        : '.toast';
    await page.waitForSelector(selector, { state: 'visible' });
}

/**
 * Dismiss toast notification
 */
export async function dismissToast(page: Page): Promise<void> {
    const closeButton = page.locator('.toast .btn-close');
    if (await closeButton.isVisible()) {
        await closeButton.click();
    }
}
