import { test as base } from '@playwright/test';
import { TubesListPage, TubeEditorPage } from '../page-objects';

/**
 * Extended test fixtures with page objects
 */
interface TestFixtures {
    tubesListPage: TubesListPage;
    tubeEditorPage: TubeEditorPage;
}

/**
 * Extend Playwright test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
    tubesListPage: async ({ page }, use) => {
        const tubesListPage = new TubesListPage(page);
        await use(tubesListPage);
    },

    tubeEditorPage: async ({ page }, use) => {
        const tubeEditorPage = new TubeEditorPage(page);
        await use(tubeEditorPage);
    },
});

export { expect } from '@playwright/test';
