import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for TubeModels e2e tests
 * Optimized for devcontainer environments
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './e2e/tests',
    // Disable parallel execution in devcontainers for better performance
    fullyParallel: false,
    forbidOnly: !!process.env['CI'],
    retries: process.env['CI'] ? 2 : 0,
    // Limit to 1 worker to reduce resource contention in containers
    workers: 1,
    // Increase timeout for slower container environments
    timeout: 60 * 1000,
    reporter: [
        ['html', { outputFolder: 'e2e-results/html' }],
        ['junit', { outputFile: 'e2e-results/junit.xml' }],
        ['list']
    ],
    outputDir: 'e2e-results/test-artifacts',

    use: {
        baseURL: 'http://localhost:4200',
        // Disable trace in devcontainers for speed
        trace: 'off',
        screenshot: 'only-on-failure',
        // Disable video recording to save resources
        video: 'off',
        // Increase navigation timeout for slower environments
        navigationTimeout: 30 * 1000,
        actionTimeout: 10 * 1000,
    },

    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // Chromium-specific flags for containers
                launchOptions: {
                    args: [
                        '--disable-dev-shm-usage',
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-gpu',
                    ],
                },
            },
        },

        // Disable other browsers by default in devcontainers for speed
        // Uncomment if needed for cross-browser testing
        /*
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },

        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },

        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
        },

        {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 12'] },
        },
        */
    ],

    webServer: {
        command: 'npm start',
        url: 'http://localhost:4200',
        reuseExistingServer: !process.env['CI'],
        timeout: 120 * 1000,
    },
});
