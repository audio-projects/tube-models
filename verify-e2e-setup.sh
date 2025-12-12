#!/bin/bash
# E2E Testing Project Verification Script

echo "========================================="
echo "E2E Testing Project Verification"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check counters
PASS=0
FAIL=0

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1 (MISSING)"
        ((FAIL++))
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $1/ (MISSING)"
        ((FAIL++))
    fi
}

echo "Checking directory structure..."
echo ""

# Check directories
check_dir "e2e"
check_dir "e2e/fixtures"
check_dir "e2e/helpers"
check_dir "e2e/page-objects"
check_dir "e2e/tests"

echo ""
echo "Checking configuration files..."
echo ""

# Check configuration files
check_file "playwright.config.ts"
check_file ".vscode/launch.json"
check_file "e2e/README.md"
check_file "e2e/SETUP.md"

echo ""
echo "Checking page objects..."
echo ""

# Check page objects
check_file "e2e/page-objects/base.page.ts"
check_file "e2e/page-objects/tubes-list.page.ts"
check_file "e2e/page-objects/tube-editor.page.ts"
check_file "e2e/page-objects/index.ts"

echo ""
echo "Checking fixtures and helpers..."
echo ""

# Check fixtures and helpers
check_file "e2e/fixtures/test-data.ts"
check_file "e2e/fixtures/test-fixtures.ts"
check_file "e2e/helpers/test-helpers.ts"

echo ""
echo "Checking test specifications..."
echo ""

# Check test files
check_file "e2e/tests/smoke.spec.ts"
check_file "e2e/tests/tubes-list.spec.ts"
check_file "e2e/tests/tube-editor.spec.ts"
check_file "e2e/tests/file-upload.spec.ts"
check_file "e2e/tests/plot-visualization.spec.ts"
check_file "e2e/tests/spice-calculation.spec.ts"
check_file "e2e/tests/data-persistence.spec.ts"

echo ""
echo "========================================="
echo "Checking NPM scripts..."
echo "========================================="
echo ""

# Check if scripts exist in package.json
if grep -q '"e2e"' package.json; then
    echo -e "${GREEN}✓${NC} npm run e2e"
    ((PASS++))
else
    echo -e "${RED}✗${NC} npm run e2e (MISSING)"
    ((FAIL++))
fi

if grep -q '"e2e:ui"' package.json; then
    echo -e "${GREEN}✓${NC} npm run e2e:ui"
    ((PASS++))
else
    echo -e "${RED}✗${NC} npm run e2e:ui (MISSING)"
    ((FAIL++))
fi

if grep -q '"e2e:debug"' package.json; then
    echo -e "${GREEN}✓${NC} npm run e2e:debug"
    ((PASS++))
else
    echo -e "${RED}✗${NC} npm run e2e:debug (MISSING)"
    ((FAIL++))
fi

echo ""
echo "========================================="
echo "Checking Playwright installation..."
echo "========================================="
echo ""

if command -v npx &> /dev/null; then
    PLAYWRIGHT_VERSION=$(npx playwright --version 2>/dev/null || echo "not installed")
    if [[ "$PLAYWRIGHT_VERSION" != "not installed" ]]; then
        echo -e "${GREEN}✓${NC} Playwright installed: $PLAYWRIGHT_VERSION"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} Playwright not installed"
        ((FAIL++))
    fi
else
    echo -e "${RED}✗${NC} npx command not found"
    ((FAIL++))
fi

# Check if @playwright/test is in package.json
if grep -q '"@playwright/test"' package.json; then
    echo -e "${GREEN}✓${NC} @playwright/test in package.json"
    ((PASS++))
else
    echo -e "${RED}✗${NC} @playwright/test not in package.json"
    ((FAIL++))
fi

echo ""
echo "========================================="
echo "Summary"
echo "========================================="
echo ""
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! E2E testing framework is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Install browsers: npm run e2e:install"
    echo "  2. Run tests: npm run e2e:ui"
    echo "  3. Read documentation: e2e/README.md"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the output above.${NC}"
    echo ""
    exit 1
fi
