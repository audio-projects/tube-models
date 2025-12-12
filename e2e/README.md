# TubeModels E2E Tests

This directory contains end-to-end (e2e) tests for the TubeModels application using Playwright.

## Directory Structure

```
e2e/
├── fixtures/          # Test data and custom test fixtures
│   ├── test-data.ts      # Test files and constants
│   └── test-fixtures.ts  # Extended Playwright fixtures with page objects
├── helpers/           # Helper functions for tests
│   └── test-helpers.ts   # Utility functions (storage, charts, etc.)
├── page-objects/      # Page Object Model (POM) classes
│   ├── base.page.ts         # Base page with common functionality
│   ├── tubes-list.page.ts   # Tubes list page object
│   ├── tube-editor.page.ts  # Tube editor page object
│   └── index.ts             # Barrel export
└── tests/             # Test specifications
    ├── smoke.spec.ts              # Smoke tests for critical paths
    ├── tubes-list.spec.ts         # Tubes list page tests
    ├── tube-editor.spec.ts        # Tube editor tests
    ├── file-upload.spec.ts        # File upload tests
    ├── plot-visualization.spec.ts # Chart/plot tests
    ├── spice-calculation.spec.ts  # SPICE parameter tests
    └── data-persistence.spec.ts   # Local storage tests
```

## Installation

Install Playwright and browsers:

```bash
npm run e2e:install
```

## Running Tests

### Run all tests (headless)
```bash
npm run e2e
```

### Run with UI mode (interactive)
```bash
npm run e2e:ui
```

### Run in headed mode (see browser)
```bash
npm run e2e:headed
```

### Run specific browser
```bash
npm run e2e:chromium
npm run e2e:firefox
npm run e2e:webkit
```

### Debug tests
```bash
npm run e2e:debug
```

### View test report
```bash
npm run e2e:report
```

## Test Patterns

### Page Object Model (POM)

Tests use the Page Object Model pattern to encapsulate page interactions:

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test('example test', async ({ tubesListPage }) => {
    await tubesListPage.goto();
    await tubesListPage.searchTubes('ECC83');
    const count = await tubesListPage.getTubeCount();
    expect(count).toBeGreaterThan(0);
});
```

### Custom Fixtures

Extended fixtures provide automatic page object initialization:

```typescript
// Available fixtures:
// - tubesListPage: TubesListPage
// - tubeEditorPage: TubeEditorPage
```

### Test Data

Use predefined test files from fixtures:

```typescript
import { TEST_FILES } from '../fixtures/test-data';

await tubeEditorPage.uploadFile(TEST_FILES.ECC83);
```

## Test Categories

### Smoke Tests (`smoke.spec.ts`)
- Application loading
- Basic routing
- Responsive layouts
- Console error checking

### Tubes List Tests (`tubes-list.spec.ts`)
- List rendering
- Search/filter functionality
- Navigation to editor
- Create new tube

### Tube Editor Tests (`tube-editor.spec.ts`)
- Form inputs
- Tab navigation
- Basic CRUD operations

### File Upload Tests (`file-upload.spec.ts`)
- Triode file upload
- Pentode file upload
- Multiple file types

### Plot Visualization Tests (`plot-visualization.spec.ts`)
- Chart rendering
- Plot updates
- Chart interactions

### SPICE Calculation Tests (`spice-calculation.spec.ts`)
- Triode parameter calculation
- Pentode parameter calculation
- Progress indicators
- Model generation

### Data Persistence Tests (`data-persistence.spec.ts`)
- Local storage save/load
- Page reload persistence
- Data restoration

## Configuration

Playwright configuration is in [playwright.config.ts](/workspaces/tube-models/playwright.config.ts):

- **Test directory**: `./e2e/tests`
- **Base URL**: `http://localhost:4200`
- **Projects**: Chromium only (optimized for devcontainers)
- **Workers**: 1 (to reduce resource contention)
- **Parallel execution**: Disabled for better performance
- **Auto-start dev server**: Yes (runs `npm start`)
- **Reporters**: HTML, JUnit, list
- **Screenshots**: On failure only
- **Videos**: Disabled (for performance)
- **Traces**: Disabled (for performance)
- **Timeouts**: Increased for slower container environments

### Devcontainer Optimizations

The configuration is optimized for devcontainer environments:
- Single worker to prevent resource contention
- Chromium with container-friendly flags (`--no-sandbox`, `--disable-dev-shm-usage`)
- Disabled video/trace recording to save CPU and disk I/O
- Increased timeouts to account for slower execution
- Other browsers commented out (uncomment if needed for cross-browser testing)

## CI/CD Integration

For CI environments, tests automatically:
- Run with 2 retries on failure
- Use single worker (no parallelization)
- Require `--forbid-only` (prevent `.only()` commits)
- Generate JUnit XML reports

## Writing New Tests

1. **Create a test file** in `e2e/tests/` with `.spec.ts` extension
2. **Import fixtures**:
   ```typescript
   import { test, expect } from '../fixtures/test-fixtures';
   ```
3. **Use page objects** from fixtures or create new ones
4. **Follow naming convention**: `describe('Feature Name', () => { ... })`
5. **Use descriptive test names**: `test('should do something when condition', ...)`

## Best Practices

- ✅ Use page objects for all UI interactions
- ✅ Use data-testid attributes for stable selectors
- ✅ Wait for elements properly (no arbitrary timeouts when possible)
- ✅ Group related tests in describe blocks
- ✅ Clean up test data in beforeEach/afterEach hooks
- ✅ Use meaningful test names that describe behavior
- ❌ Avoid hardcoded waits (use waitFor* methods)
- ❌ Don't couple tests (each should be independent)
- ❌ Don't test implementation details

## Troubleshooting

### Tests fail to start
- Ensure dev server is not already running on port 4200
- Check `npm install` was run successfully
- Verify Playwright browsers are installed: `npm run e2e:install`

### Flaky tests
- Use proper wait conditions instead of timeouts
- Check for race conditions in async operations
- Use `test.retry()` for known flaky tests

### Debugging
- Use `npm run e2e:debug` for step-by-step debugging
- Add `await page.pause()` to stop execution
- Check screenshots in `e2e-results/test-artifacts/`

## Coverage

E2E tests cover:
- 🟢 Application routing and navigation
- 🟢 Tube list browsing and search
- 🟢 Tube editor CRUD operations
- 🟢 File upload for triode/pentode
- 🟢 Plot visualization and rendering
- 🟢 SPICE parameter calculation
- 🟢 Local storage persistence
- 🟡 Authentication (manual testing required)
- 🟡 Firebase integration (requires test environment)

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
