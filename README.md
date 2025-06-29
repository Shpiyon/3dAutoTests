# 3D Visualization Website Testing Framework

Automated testing framework for 3D visualization websites using Playwright and TypeScript.

**14 tests across 3 files** | **CI + Local modes**

## Prerequisites

- Node.js 18+
- Windows PowerShell

## Installation

```powershell
npm install
npx playwright install chromium
```

## Usage

```powershell
# Run all tests (local mode)
npm test

# Run in CI mode (faster, element screenshots only)
$env:CI="true"; npm test

# Run specific test file
npx playwright test home.spec.ts
npx playwright test apartaments.spec.ts
npx playwright test amenities.spec.ts

# Debug mode
npm run test:ui

# View reports
npm run test:report
```

## Configuration

### Environment Variables

```bash
CI=true                    # Enable CI mode
ENABLE_AI_ANALYSIS=false   # Enable AI analysis (optional)
OPENAI_API_KEY=sk-...      # OpenAI API key (if using AI)
```

## Project Structure

```
tests/
├── home.spec.ts        # Home page tests (3 tests)
├── apartaments.spec.ts # Apartments tests (6 tests)
└── amenities.spec.ts   # Amenities tests (5 tests)

pages/                  # Page Object Model
├── HomePage.ts
├── BasePage.ts
├── amenities-page/
└── apartments-page/

utils/                  # Testing utilities
├── screenshotTester.ts
├── testReportUtils.ts
├── configUtils.ts
└── aiScreenshotAnalyzer.ts
```

## Test Modes

| Mode  | Command                    | Tests Run    | Screenshot Type |
| ----- | -------------------------- | ------------ | --------------- |
| Local | `npm test`                 | All 14 tests | Full-page       |
| CI    | `$env:CI="true"; npm test` | ~7 tests     | Element-focused |

## CI mode disable the wainting for the 3D Model to load and skip all the test cases that verify the fullpage screenshots
