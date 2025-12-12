# E2E Testing Quick Start Guide

## ✅ Setup Complete!

The E2E testing framework is fully configured and ready to use.

## Quick Commands

### 1. First Time Setup (One-Time)

```bash
# Install Playwright browsers (~500MB download)
npm run e2e:install
```

This will install Chromium, Firefox, and WebKit browsers needed for testing.

### 2. Run Tests

```bash
# Interactive UI mode (RECOMMENDED for development)
npm run e2e:ui

# Headless mode (fast, no browser window)
npm run e2e

# Headed mode (see the browser)
npm run e2e:headed

# Debug mode (step-by-step debugging)
npm run e2e:debug
```

### 3. Specific Browser

```bash
npm run e2e:chromium
npm run e2e:firefox
npm run e2e:webkit
```

### 4. View Results

```bash
# Open HTML report
npm run e2e:report
```

## What Tests Are Available?

### 🔥 Smoke Tests
- Application loads correctly
- Routing works
- No console errors
- Responsive layouts

### 📋 Tubes List Tests
- Display tube list
- Search functionality
- Navigation to editor
- Create new tube

### ✏️ Tube Editor Tests
- Form inputs
- Tab navigation
- File upload
- Plot display

### 📊 Plot Visualization Tests
- Chart rendering
- Plot updates
- Triode/Pentode plots

### ⚡ SPICE Calculation Tests
- Parameter calculation
- Model generation
- Progress indicators

### 💾 Data Persistence Tests
- Local storage save/load
- Page reload persistence

### 📁 File Upload Tests
- Triode file upload
- Pentode file upload
- Multiple file types

## 📝 VS Code Integration

Debug configurations available in Run & Debug panel:
- **E2E Tests (Debug)** - Step-by-step debugging
- **E2E Tests (Headed)** - See browser during tests
- **E2E Tests (UI Mode)** - Interactive test runner

## 📖 Documentation

- **[Complete E2E Guide](e2e/README.md)** - Full documentation
- **[Setup Guide](e2e/SETUP.md)** - Detailed installation
- **[Project Summary](E2E_PROJECT_SUMMARY.md)** - Architecture overview

## ⚡ Performance Note (Devcontainers)

The configuration is **optimized for devcontainer environments**:
- Only Chromium browser enabled (fastest)
- Video/trace recording disabled
- Single worker to prevent resource contention
- Increased timeouts for slower execution

Expect tests to run slower than native environments (3-5 min for full suite).

## 🎯 Recommended First Steps

1. **Install browsers** (one-time):
   ```bash
   npm run e2e:install
   ```

2. **Run specific tests first** (faster):
   ```bash
   # Run just smoke tests (~30 seconds)
   npx playwright test e2e/tests/smoke.spec.ts
   ```

3. **Try interactive mode**:
   ```bash
   npm run e2e:ui
   ```
   
   This opens a visual interface where you can:
   - ✅ See all tests
   - ✅ Run individual tests
   - ✅ Time-travel debug
   - ✅ Pick locators
   - ✅ Watch mode

3. **Run smoke tests first**:
   ```bash
   npx playwright test e2e/tests/smoke.spec.ts
   ```

4. **View results**:
   ```bash
   npm run e2e:report
   ```

## 🔧 Common Tasks

### Run a Single Test File
```bash
npx playwright test e2e/tests/tubes-list.spec.ts
```

### Run Tests Matching a Pattern
```bash
npx playwright test -g "should display"
```

### Debug a Specific Test
```bash
npx playwright test e2e/tests/smoke.spec.ts --debug
```

### Run in Headed Mode
```bash
npx playwright test --headed
```

## 🐛 Troubleshooting

### "Port 4200 already in use"
Kill the process:
```bash
pkill -f "ng serve"
```

### "Browsers not installed"
Run:
```bash
npm run e2e:install
```

### "Tests timing out"
Increase timeout in test or config:
```typescript
test.setTimeout(120000); // 2 minutes
```

## 📊 Test Results Location

- **HTML Report**: `e2e-results/html/`
- **JUnit XML**: `e2e-results/junit.xml`
- **Screenshots**: `e2e-results/test-artifacts/`
- **Videos**: `e2e-results/test-artifacts/`
- **Traces**: `e2e-results/test-artifacts/`

## 🎓 Learning Resources

### Interactive Mode Features
- **Watch mode**: Auto-reruns on file changes
- **Pick locator**: Click elements to generate selectors
- **Timeline**: See test execution timeline
- **Network tab**: Inspect API calls
- **Console logs**: View browser console

### Best Practices
1. Use page objects for all interactions
2. Wait for elements properly (no arbitrary timeouts)
3. Each test should be independent
4. Use descriptive test names
5. Clean up test data

## ✨ What's Included

- ✅ **7 test suites** with 30+ test cases
- ✅ **Page Object Model** for maintainability
- ✅ **Multi-browser support** (Chrome, Firefox, Safari, Mobile)
- ✅ **Auto-screenshots/videos** on failure
- ✅ **VS Code debugging** configurations
- ✅ **CI/CD ready** with JUnit reports
- ✅ **Comprehensive documentation**

## 🚀 Start Testing Now!

```bash
# One command to start testing
npm run e2e:ui
```

Enjoy testing! 🎉
