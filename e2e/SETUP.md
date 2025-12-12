# E2E Testing Setup Guide

This document provides step-by-step instructions for setting up and running e2e tests.

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- TubeModels application installed

## Installation Steps

### 1. Install Dependencies

Install Playwright and its dependencies:

```bash
npm install
```

### 2. Install Playwright Browsers

Install Playwright browsers (Chromium, Firefox, WebKit):

```bash
npm run e2e:install
```

This downloads browser binaries (~500MB) needed for testing.

### 3. Verify Installation

Run smoke tests to verify setup:

```bash
npm run e2e -- e2e/tests/smoke.spec.ts
```

## Quick Start

### Running Your First Test

```bash
# Run all tests in headless mode
npm run e2e

# Run with UI (recommended for development)
npm run e2e:ui

# Run in headed mode (see the browser)
npm run e2e:headed
```

### Interactive UI Mode

The UI mode is the best way to develop and debug tests:

```bash
npm run e2e:ui
```

Features:
- ✅ Visual test runner
- ✅ Time travel debugging
- ✅ Watch mode
- ✅ Pick locators tool
- ✅ Run individual tests

## Running Specific Tests

### By File

```bash
# Run specific test file
npx playwright test e2e/tests/tubes-list.spec.ts

# Run multiple files
npx playwright test e2e/tests/smoke.spec.ts e2e/tests/tubes-list.spec.ts
```

### By Test Name

```bash
# Run tests matching a pattern
npx playwright test -g "should display"

# Run specific test
npx playwright test -g "should upload triode measurement file"
```

### By Browser

```bash
npm run e2e:chromium
npm run e2e:firefox
npm run e2e:webkit
```

## Debugging Tests

### Method 1: Debug Mode

```bash
npm run e2e:debug
```

Opens Playwright Inspector for step-by-step debugging.

### Method 2: VS Code Debugger

Add to `.vscode/launch.json`:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug E2E Tests",
            "type": "node",
            "request": "launch",
            "runtimeExecutable": "npm",
            "runtimeArgs": ["run", "e2e:debug"],
            "console": "integratedTerminal"
        }
    ]
}
```

### Method 3: Pause in Code

Add to your test:

```typescript
await page.pause();
```

## Viewing Test Results

### HTML Report

After test run:

```bash
npm run e2e:report
```

Opens interactive HTML report showing:
- Test results
- Screenshots on failure
- Videos on failure
- Trace viewer

### Console Output

Tests output results to console:
- ✅ Passed tests
- ❌ Failed tests
- ⊘ Skipped tests

## Writing Your First Test

### 1. Create Test File

Create `e2e/tests/my-feature.spec.ts`:

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test.describe('My Feature', () => {
    test('should do something', async ({ page, tubesListPage }) => {
        await tubesListPage.goto();
        await tubesListPage.waitForLoad();
        
        // Your test logic here
        const title = await page.title();
        expect(title).toContain('TubeModels');
    });
});
```

### 2. Run Your Test

```bash
npx playwright test e2e/tests/my-feature.spec.ts
```

### 3. Debug if Needed

```bash
npx playwright test e2e/tests/my-feature.spec.ts --debug
```

## Common Test Patterns

### Upload a File

```typescript
import { TEST_FILES } from '../fixtures/test-data';

await tubeEditorPage.uploadFile(TEST_FILES.ECC83);
```

### Wait for Element

```typescript
await expect(page.locator('.my-element')).toBeVisible();
```

### Navigate

```typescript
await page.goto('/tube');
await page.waitForLoadState('networkidle');
```

### Assert Text

```typescript
await expect(page.locator('h1')).toHaveText('Expected Text');
```

### Click Button

```typescript
await page.locator('button:has-text("Submit")').click();
```

## Configuration

Edit [playwright.config.ts](/workspaces/tube-models/playwright.config.ts) to customize:

- Base URL
- Timeout values
- Retry attempts
- Browsers to test
- Reporter options
- Screenshot/video settings

## Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: e2e-results/
```

## Performance in Devcontainers

The configuration is optimized for devcontainer environments:

### Already Applied Optimizations
- ✅ Single worker (prevents resource contention)
- ✅ Chromium only (Firefox/WebKit disabled)
- ✅ Video recording disabled
- ✅ Trace recording disabled
- ✅ Container-friendly Chromium flags
- ✅ Increased timeouts

### Additional Performance Tips

**Run specific tests instead of the full suite:**
```bash
# Run only smoke tests
npx playwright test e2e/tests/smoke.spec.ts

# Run specific test file
npx playwright test e2e/tests/tubes-list.spec.ts
```

**Use headed mode sparingly:**
```bash
# Headless is faster (default)
npm run e2e

# Only use headed mode when debugging
npm run e2e:headed
```

**Enable cross-browser testing only when needed:**

Uncomment other browsers in `playwright.config.ts` only for final validation.

## Troubleshooting

### Tests Running Slowly

In devcontainers, expect tests to run slower than on native systems:
- Typical test: 5-15 seconds (vs 2-5 seconds native)
- Full suite: 3-5 minutes (vs 1-2 minutes native)

This is normal due to container overhead.

### Port Already in Use

If port 4200 is already in use:

```bash
# Kill the process using port 4200
lsof -ti:4200 | xargs kill -9

# Or change port in playwright.config.ts
```

### Browsers Not Installed

```bash
npm run e2e:install
```

### Tests Timing Out

Increase timeout in test:

```typescript
test('slow test', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes
    // test code
});
```

### Screenshots/Videos Not Captured

Check `playwright.config.ts`:

```typescript
use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
}
```

## Next Steps

- Read the [E2E README](/workspaces/tube-models/e2e/README.md)
- Explore existing tests in `e2e/tests/`
- Check [Playwright documentation](https://playwright.dev)
- Review page objects in `e2e/page-objects/`

## Getting Help

- Playwright docs: https://playwright.dev
- Playwright Discord: https://aka.ms/playwright/discord
- GitHub issues: https://github.com/microsoft/playwright/issues
