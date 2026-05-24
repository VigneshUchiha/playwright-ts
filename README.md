# playwright-ts

> Playwright + TypeScript test automation framework — Web (SauceDemo) + API (Restful-Booker) — built with Page Object Model, custom action wrappers, fixtures, multi-environment config, and Allure reporting.

[![CI](https://github.com/<your-username>/playwright-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/<your-username>/playwright-ts/actions/workflows/ci.yml)

## Table of Contents

- [What this is](#what-this-is)
- [Prerequisites](#prerequisites)
- [Quick start](#quick-start)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Running tests](#running-tests)
- [Writing tests](#writing-tests)
- [Reporting](#reporting)
- [Design decisions](#design-decisions)
- [License](#license)

## What this is

A portfolio-grade Playwright + TypeScript framework that demonstrates senior-level test automation patterns against publicly available test targets:

- **Web UI tests** against [SauceDemo](https://www.saucedemo.com) on Chromium, Firefox, and WebKit
- **API tests** against [Restful-Booker](https://restful-booker.herokuapp.com) — auth, CRUD, schema validation
- **Phase 2 (planned):** Mobile tests against Sauce Labs Sample App on Android via Appium + WebdriverIO

## Prerequisites

- Node.js 20+
- npm 10+

## Quick start

```bash
git clone https://github.com/<your-username>/playwright-ts.git
cd playwright-ts
npm install
npx playwright install --with-deps chromium firefox webkit
npm test
```

The targets ship credentials publicly (SauceDemo lists them on its login screen, Restful-Booker prints `admin/password123` in its docs), so the default `config/secrets/secrets.template.json` is enough to run.

## Project structure

```
config/
  environments/         # Per-environment JSON (dev, ci)
  secrets/              # Credentials (template committed, real file gitignored)
  env.config.ts         # Runtime loader (merges JSON + secrets + env vars)
  routes.config.ts      # Web route paths
  api-routes.config.ts  # API endpoint paths

src/
  pages/
    web/                # Page Object Model — extends BasePage
  services/
    api/                # API service classes — extends BaseApiService
  utils/
    uiActions.ts        # Wrapper over Playwright Page (the only layer that talks to Playwright)
    apiClient.ts        # Wrapper over Playwright APIRequestContext
    logger.ts           # TestLogger
    schemaValidator.ts  # AJV wrapper for JSON Schema validation
    testDataManager.ts  # TC-ID lookup in testdata.json
    testDataUtils.ts    # uniqueName, randomEmail, etc.
    allureSetup.ts      # globalSetup writing environment.properties
    allureUtils.ts      # setTestMetadata({ feature, story, severity, testId, tags })
  fixtures/
    page.fixtures.ts    # Injects page objects into web specs
    api.fixtures.ts     # Injects API services into API specs
    index.ts            # Exports `test` and `apiTest`

test-data/
  testdata.json         # TC-ID-keyed test data
  schemas/              # JSON Schemas for API response validation

tests/
  unit/                 # Unit tests for utilities
  api/                  # API integration specs
  web/                  # Web E2E specs

docs/
  locators/             # Verified Playwright locators (extracted via browser_generate_locator MCP)
  superpowers/specs/    # Design spec
  superpowers/plans/    # Implementation plan
```

## Architecture

### Playwright projects

| Project               | What it tests                                                                 | Browser? |
| --------------------- | ----------------------------------------------------------------------------- | -------- |
| `unit`                | Utility code (env loader, schema validator, logger, data generators)          | none     |
| `api`                 | Restful-Booker                                                                | none     |
| `chromium`            | SauceDemo on Desktop Chrome                                                   | yes      |
| `firefox`             | SauceDemo on Desktop Firefox                                                  | yes      |
| `webkit`              | SauceDemo on Desktop Safari                                                   | yes      |
| `android` _(planned)_ | Sauce Labs Sample App — Phase 2, not registered in `playwright.config.ts` yet | Appium   |

Five live projects plus an android Phase 2 placeholder.

### Core patterns

**Page Object Model** — every web page is a class extending `BasePage`. Locators are private getters; actions are public methods wrapped in `this.step()`; assertions live in `verify*()` methods on the page class itself, never in specs.

**API Service Model** — every API resource is a class extending `BaseApiService`. CRUD methods + `verify*()` methods, same pattern.

**UIActions / ApiClient wrappers** — every interaction goes through `this.ui.*` or `this.apiClient.*`. The wrappers are the ONLY layer that talks to Playwright primitives. Single seam for logging, retries, evidence.

**Assertion delegation** — `expect()` lives only inside `verify*()` methods. Specs read like English: `await loginPage.signIn(user); await inventoryPage.verifyOnInventory();`. An ESLint rule enforces this.

**Step annotations** — every page/service method emits `test.step()`, so the Allure report reads as user-narrative ("Click Login button") not Playwright internals ("Wait for selector …").

## Running tests

```bash
# All projects
npm test

# Specific project
npm run test:unit
npm run test:api
npm run test:web

# By tag
npm run test:smoke           # All @smoke tests across projects
npm run test:regression      # Everything except @smoke

# Specific environment
npm run test:dev             # config/environments/dev.json (default)
npm run test:ci              # config/environments/ci.json (longer timeouts)

# Single spec
npx playwright test tests/web/auth/login.spec.ts --project=chromium

# Filter by tag in test name
npx playwright test --grep "@auth"

# Headed (for debugging)
npm run test:headed
```

## Writing tests

### Adding a web page object

1. Create `src/pages/web/<name>.page.ts` extending `BasePage`
2. Implement `pageIdentifier` getter (the unique element that confirms the page loaded)
3. Define locators as private getters using `this.page.locator(...)` or `this.page.getByTestId(...)`
4. Add action methods wrapped in `this.step()`
5. Add `verify*()` methods that call `this.ui.expectVisible`/`expectText`/`expectURL`
6. Export from `src/pages/web/index.ts`
7. Add a fixture in `src/fixtures/page.fixtures.ts` and register the type in `src/fixtures/types.ts`
8. Add the new `verify*` method name to `assertFunctionNames` in `.eslintrc.json`

### Adding an API service

1. Create `src/services/api/<name>.api.ts` extending `BaseApiService`
2. Add CRUD methods using `this.apiClient.get/post/put/delete`
3. Register JSON schemas (`SchemaValidator.register`) and call `validator.validate` inside `verify*()` methods
4. Export from `src/services/api/index.ts`
5. Add a fixture in `src/fixtures/api.fixtures.ts` and register the type in `src/fixtures/types.ts`
6. Add the new `verify*` method name to `assertFunctionNames` in `.eslintrc.json`

### Test data

All test data is externalized in `test-data/testdata.json`, keyed by `TC_ID`:

```ts
import { testDataManager } from '@/utils/testDataManager';
const user = testDataManager.getByTcId<WebUserRow>('web_users', 'TC_WEB_AUTH_001');
```

For unique values per run, use `uniqueName`, `randomEmail`, etc. from `src/utils/testDataUtils`.

## Reporting

```bash
npm run allure:serve         # Generate and open Allure in one step
npm run allure:generate      # Generate report into allure-report/
npm run allure:open          # Open previously generated report
```

Allure metadata (feature, story, severity, tags) is set per test using `setTestMetadata()`:

```ts
await setTestMetadata({
  feature: 'SauceDemo — Auth',
  story: 'Login — standard user',
  severity: Severity.CRITICAL,
  testId: 'TC_WEB_AUTH_001',
  tags: ['@smoke', '@auth'],
});
```

Failure artifacts (trace, screenshot, video) are captured on failure only — green runs produce zero artifacts.

## Design decisions

| Decision                                                              | Rationale                                                         |
| --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `UIActions` / `ApiClient` wrappers over raw `page.*` / `request.*`    | Single point of control for logging, evidence, future retry logic |
| Assertions in `verify*()` only, never in specs                        | Specs read as English; assertions are reusable across tests       |
| Step annotations on every method                                      | Allure tree reads as user narrative, not Playwright internals     |
| Externalized test data (JSON keyed by TC_ID)                          | No hardcoded values; easy to extend and review                    |
| AJV schema validation for API responses                               | Catches structural regressions beyond field-level assertions      |
| Separate Playwright project for API tests                             | API tests skip browser launch — fastest cold start                |
| Verified locators (extracted via `browser_generate_locator` MCP tool) | Locators are correct by construction, not guessed                 |
| `TestLogger` instead of `console.log`                                 | Structured, leveled output                                        |
| Cleanup in `afterEach`                                                | Idempotent tests; no leftover data across runs                    |
| Secrets loaded from file or env vars                                  | Works locally (`secrets.json`) and in CI (environment variables)  |
| Default to headless mode                                              | `npm test` runs headless; use `npm run test:headed` to debug      |

## License

MIT — see [LICENSE](./LICENSE).
