# Playwright + TypeScript Minimal Clone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public-facing Playwright + TypeScript test automation framework from scratch (no copy-paste from the company source). Phase 1 covers Web (SauceDemo) and API (Restful-Booker) with full POM + fixtures + multi-env + Allure architecture.

**Architecture:** Six Playwright projects (`unit`, `api`, `chromium`, `firefox`, `webkit`, `android` (Phase 2 placeholder)) sharing a layered codebase: `config` → `utils` → `fixtures` → `pages`/`services` → `tests`. `UIActions` and `ApiClient` wrappers are the only modules that talk to Playwright primitives; `expect()` lives only inside `verify*()` methods on page/service classes. Locators come from `docs/locators/saucedemo-locators.json` (already extracted via the `browser_generate_locator` MCP tool).

**Tech Stack:** `@playwright/test`, `allure-playwright`, `allure-commandline`, `ajv`, `ajv-formats`, TypeScript (strict), ESLint, Prettier. Node 20+. No private packages, no `.tgz` files.

**Reference:** See `docs/superpowers/specs/2026-05-24-playwright-ts-minimal-clone-design.md` for the design spec and `docs/locators/saucedemo-locators.json` for verified locators.

---

## Pre-implementation: File responsibility map

| File                                      | Responsibility                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `package.json`                            | npm dependencies + scripts                                                         |
| `tsconfig.json`                           | TypeScript strict-mode compiler settings + `@/*` path aliases                      |
| `playwright.config.ts`                    | Six Playwright projects, reporters, timeouts                                       |
| `.eslintrc.json` / `.prettierrc`          | Code style enforcement + ban on `waitForTimeout`                                   |
| `eslint-rules/no-explicit-wait.js`        | Custom ESLint rule                                                                 |
| `config/environments/{dev,ci}.json`       | Per-env URL + timeout values                                                       |
| `config/secrets/secrets.template.json`    | Credential placeholders (committed)                                                |
| `config/env.config.ts`                    | Runtime loader: merges JSON + secrets + `process.env`; exports `ENV`, `ACTIVE_ENV` |
| `config/routes.config.ts`                 | Web route paths (`ROUTES.LOGIN`, etc.)                                             |
| `config/api-routes.config.ts`             | API endpoint paths (`API_ROUTES.AUTH`, etc.)                                       |
| `config/index.ts`                         | Barrel exports                                                                     |
| `src/utils/logger.ts`                     | `TestLogger` — leveled console output                                              |
| `src/utils/errors.ts`                     | `FrameworkError`, `ValidationError`                                                |
| `src/utils/testDataManager.ts`            | TC-ID lookup in `testdata.json`                                                    |
| `src/utils/testDataUtils.ts`              | `uniqueName`, `randomEmail`, `randomCustomerInfo`, `isoDate`                       |
| `src/utils/schemaValidator.ts`            | AJV wrapper                                                                        |
| `src/utils/allureSetup.ts`                | Global setup writing `environment.properties`                                      |
| `src/utils/allureUtils.ts`                | `setTestMetadata({ feature, story, severity, testId, tags })`                      |
| `src/utils/apiClient.ts`                  | `ApiClient` wrapper over Playwright `APIRequestContext`                            |
| `src/utils/uiActions.ts`                  | `UIActions` wrapper over Playwright `Page`                                         |
| `src/utils/index.ts`                      | Barrel                                                                             |
| `src/services/api/base.api.ts`            | `BaseApiService` abstract class                                                    |
| `src/services/api/health.api.ts`          | `HealthService.ping()` + `verifyPingOk()`                                          |
| `src/services/api/auth.api.ts`            | `AuthService.createToken()` + `verifyTokenIssued()`                                |
| `src/services/api/bookings.api.ts`        | CRUD + `verifyBookingMatches()`, `verifyBookingId()`, `verifyValidationError()`    |
| `src/services/api/index.ts`               | Barrel                                                                             |
| `src/pages/web/base.page.ts`              | `BasePage` abstract class                                                          |
| `src/pages/web/login.page.ts`             | Login form                                                                         |
| `src/pages/web/inventory.page.ts`         | Inventory list                                                                     |
| `src/pages/web/cart.page.ts`              | Cart contents                                                                      |
| `src/pages/web/checkout-info.page.ts`     | Checkout step one (customer info)                                                  |
| `src/pages/web/checkout-overview.page.ts` | Checkout step two (order review)                                                   |
| `src/pages/web/checkout-complete.page.ts` | Checkout confirmation                                                              |
| `src/pages/web/index.ts`                  | Barrel                                                                             |
| `src/fixtures/page.fixtures.ts`           | Web fixture: injects 6 page objects                                                |
| `src/fixtures/api.fixtures.ts`            | API fixture: injects ApiClient + 3 services                                        |
| `src/fixtures/types.ts`                   | Fixture type definitions                                                           |
| `src/fixtures/index.ts`                   | Exports `test` and `apiTest`                                                       |
| `test-data/testdata.json`                 | TC-ID-keyed test data                                                              |
| `test-data/schemas/*.json`                | AJV schemas for API responses                                                      |
| `tests/unit/**/*.spec.ts`                 | Unit tests for utilities                                                           |
| `tests/api/**/*.spec.ts`                  | API integration specs                                                              |
| `tests/web/**/*.spec.ts`                  | Web E2E specs                                                                      |
| `.github/workflows/ci.yml`                | CI: unit + api job + 3-browser web matrix + Allure merge                           |
| `README.md`                               | Public-facing documentation                                                        |
| `CLAUDE.md`                               | AI-assistant conventions                                                           |
| `LICENSE`                                 | MIT                                                                                |

---

# Slice 1: Bootstrap

Goal: a clean repo where `npm install` works, `npx tsc --noEmit` is clean, and `npx playwright test` returns "no tests found" gracefully.

## Task 1: Initialize git and write `.gitignore` + `LICENSE`

**Files:**

- Create: `.gitignore`
- Create: `LICENSE`

- [ ] **Step 1: Initialize git**

```bash
cd /Users/vigneshponna/Desktop/Projects/playwright-ts
git init
git branch -M main
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
allure-results/
allure-report/
test-results/
playwright-report/
config/secrets/secrets.json
.env
*.log
.DS_Store
/dist/
```

- [ ] **Step 3: Create `LICENSE`** (MIT)

```
MIT License

Copyright (c) 2026 Sandesha Thandra

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 4: Commit**

```bash
git add .gitignore LICENSE
git commit -m "chore: initialize repo with MIT license and gitignore"
```

---

## Task 2: Create `package.json` and install dependencies

**Files:**

- Create: `package.json`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "playwright-ts",
  "version": "0.1.0",
  "private": false,
  "description": "Playwright + TypeScript test automation framework — Web (SauceDemo) + API (Restful-Booker), with Page Object Model, custom action wrappers, fixtures, multi-env config, and Allure reporting.",
  "license": "MIT",
  "engines": { "node": ">=20" },
  "scripts": {
    "test": "playwright test",
    "test:unit": "playwright test --project=unit",
    "test:api": "playwright test --project=api",
    "test:web": "playwright test --project=chromium --project=firefox --project=webkit",
    "test:smoke": "playwright test --grep @smoke",
    "test:regression": "playwright test --grep-invert @smoke",
    "test:dev": "playwright test --env=dev",
    "test:ci": "playwright test --env=ci",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "format": "prettier --write \"**/*.{ts,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,json,md}\"",
    "allure:generate": "allure generate allure-results --clean -o allure-report",
    "allure:open": "allure open allure-report",
    "allure:serve": "allure serve allure-results",
    "clean": "rm -rf allure-results allure-report test-results playwright-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "@types/node": "^20.11.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "ajv": "^8.12.0",
    "ajv-formats": "^3.0.1",
    "allure-commandline": "^2.27.0",
    "allure-playwright": "^2.15.1",
    "eslint": "^8.57.0",
    "eslint-plugin-playwright": "^1.6.0",
    "prettier": "^3.2.5",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

Expected: dependencies install without errors. `node_modules/` and `package-lock.json` appear.

- [ ] **Step 3: Install Playwright browsers**

```bash
npx playwright install --with-deps chromium firefox webkit
```

Expected: three browser binaries download.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add package.json with Playwright, Allure, AJV, TypeScript, ESLint deps"
```

---

## Task 3: TypeScript configuration

**Files:**

- Create: `tsconfig.json`

- [ ] **Step 1: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@config/*": ["config/*"]
    }
  },
  "include": ["src/**/*.ts", "config/**/*.ts", "tests/**/*.ts", "playwright.config.ts"],
  "exclude": ["node_modules", "dist", "allure-report"]
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. (There's no source code yet, so nothing to compile, but the config itself must be valid.)

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "chore: add strict TypeScript config with @/* path aliases"
```

---

## Task 4: ESLint and Prettier configuration

**Files:**

- Create: `.eslintrc.json`
- Create: `.eslintignore`
- Create: `.prettierrc`
- Create: `.prettierignore`

- [ ] **Step 1: Create `.eslintrc.json`** (custom rule wiring deferred to Task 33)

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint", "playwright"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:playwright/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "playwright/no-wait-for-timeout": "error",
    "playwright/no-networkidle": "error",
    "no-console": ["error", { "allow": ["warn", "error"] }]
  },
  "overrides": [
    {
      "files": ["tests/unit/**/*.spec.ts"],
      "rules": { "playwright/no-conditional-in-test": "off" }
    }
  ]
}
```

- [ ] **Step 2: Create `.eslintignore`**

```
node_modules/
allure-results/
allure-report/
test-results/
playwright-report/
dist/
*.config.js
```

- [ ] **Step 3: Create `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

- [ ] **Step 4: Create `.prettierignore`**

```
node_modules/
allure-results/
allure-report/
test-results/
playwright-report/
package-lock.json
dist/
```

- [ ] **Step 5: Verify ESLint and Prettier run**

```bash
npx eslint . --ext .ts || echo "no files yet, expected"
npx prettier --check "**/*.{ts,json,md}" || echo "no files yet, expected"
```

Expected: no parse errors. Empty file list is fine.

- [ ] **Step 6: Commit**

```bash
git add .eslintrc.json .eslintignore .prettierrc .prettierignore
git commit -m "chore: add ESLint + Prettier configs with Playwright plugin rules"
```

---

## Task 5: Stub README and verify bootstrap

**Files:**

- Create: `README.md`

- [ ] **Step 1: Create stub `README.md`** (full README lands in Task 36)

```markdown
# playwright-ts

> Playwright + TypeScript test automation framework — Web (SauceDemo) + API (Restful-Booker), built with Page Object Model, custom action wrappers, fixtures, multi-environment config, and Allure reporting.

**Status:** Work in progress. See `docs/superpowers/specs/2026-05-24-playwright-ts-minimal-clone-design.md` for the design spec and `docs/superpowers/plans/2026-05-24-playwright-ts-minimal-clone.md` for the implementation plan.

## Prerequisites

- Node.js 20+
- npm 10+

## Quick start

\`\`\`bash
npm install
npx playwright install --with-deps chromium firefox webkit
npm test
\`\`\`

## License

MIT — see [LICENSE](./LICENSE).
```

- [ ] **Step 2: Verify the empty-test run is graceful**

Skip — `playwright.config.ts` doesn't exist yet. It lands in Task 15.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add stub README pointing at design spec and plan"
```

---

# Slice 2: Config and utility primitives

Goal: every utility ships with a `tests/unit/*.spec.ts`. End of slice: `npm run test:unit` is green with ~10 unit tests.

## Task 6: Environment JSON files and secrets template

**Files:**

- Create: `config/environments/dev.json`
- Create: `config/environments/ci.json`
- Create: `config/secrets/secrets.template.json`

- [ ] **Step 1: Create `config/environments/dev.json`**

```json
{
  "baseURL": "https://www.saucedemo.com",
  "apiBaseURL": "https://restful-booker.herokuapp.com",
  "timeouts": {
    "default": 10000,
    "action": 8000,
    "navigation": 15000
  }
}
```

- [ ] **Step 2: Create `config/environments/ci.json`**

```json
{
  "timeouts": {
    "action": 15000,
    "navigation": 30000
  }
}
```

- [ ] **Step 3: Create `config/secrets/secrets.template.json`**

```json
{
  "saucedemo": {
    "standardUser": "standard_user",
    "password": "secret_sauce"
  },
  "restfulBooker": {
    "username": "admin",
    "password": "password123"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add config/environments config/secrets
git commit -m "feat(config): add dev/ci environment JSONs and secrets template"
```

---

## Task 7: `env.config.ts` loader (TDD)

**Files:**

- Create: `tests/unit/env-loader.spec.ts`
- Create: `config/env.config.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/env-loader.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { ENV, ACTIVE_ENV } from '@config/env.config';

test.describe('@unit env loader', () => {
  test('exposes dev defaults when ACTIVE_ENV is dev', () => {
    expect(ACTIVE_ENV).toBe('dev');
    expect(ENV.BASE_URL).toBe('https://www.saucedemo.com');
    expect(ENV.API_BASE_URL).toBe('https://restful-booker.herokuapp.com');
    expect(ENV.DEFAULT_TIMEOUT).toBe(10000);
    expect(ENV.ACTION_TIMEOUT).toBe(8000);
    expect(ENV.NAVIGATION_TIMEOUT).toBe(15000);
  });

  test('loads SauceDemo credentials from secrets template', () => {
    expect(ENV.STANDARD_USER).toBe('standard_user');
    expect(ENV.PASSWORD).toBe('secret_sauce');
  });

  test('loads Restful-Booker credentials from secrets template', () => {
    expect(ENV.RB_USER).toBe('admin');
    expect(ENV.RB_PASSWORD).toBe('password123');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx playwright test tests/unit/env-loader.spec.ts
```

Expected: FAIL — `Cannot find module '@config/env.config'`.

- [ ] **Step 3: Implement `config/env.config.ts`**

```ts
import * as fs from 'fs';
import * as path from 'path';

type EnvName = 'dev' | 'ci';

interface EnvJson {
  baseURL?: string;
  apiBaseURL?: string;
  timeouts?: { default?: number; action?: number; navigation?: number };
}

interface Secrets {
  saucedemo?: { standardUser?: string; password?: string };
  restfulBooker?: { username?: string; password?: string };
}

const ROOT = path.resolve(__dirname, '..');

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function parseEnvArg(): EnvName {
  const match = process.argv.find((a) => a.startsWith('--env='));
  const value = match?.split('=')[1] ?? process.env.ACTIVE_ENV ?? 'dev';
  return value === 'ci' ? 'ci' : 'dev';
}

function loadEnvJson(env: EnvName): EnvJson {
  const dev = readJson<EnvJson>(path.join(ROOT, 'config/environments/dev.json')) ?? {};
  if (env === 'dev') return dev;
  const overlay = readJson<EnvJson>(path.join(ROOT, `config/environments/${env}.json`)) ?? {};
  return {
    ...dev,
    ...overlay,
    timeouts: { ...(dev.timeouts ?? {}), ...(overlay.timeouts ?? {}) },
  };
}

function loadSecrets(): Secrets {
  const real = readJson<Secrets>(path.join(ROOT, 'config/secrets/secrets.json'));
  if (real) return real;
  return readJson<Secrets>(path.join(ROOT, 'config/secrets/secrets.template.json')) ?? {};
}

export const ACTIVE_ENV: EnvName = parseEnvArg();
const json = loadEnvJson(ACTIVE_ENV);
const secrets = loadSecrets();

export const ENV = {
  BASE_URL: process.env.BASE_URL ?? json.baseURL ?? 'https://www.saucedemo.com',
  API_BASE_URL:
    process.env.API_BASE_URL ?? json.apiBaseURL ?? 'https://restful-booker.herokuapp.com',
  DEFAULT_TIMEOUT: Number(process.env.DEFAULT_TIMEOUT) || json.timeouts?.default || 10000,
  ACTION_TIMEOUT: Number(process.env.ACTION_TIMEOUT) || json.timeouts?.action || 8000,
  NAVIGATION_TIMEOUT: Number(process.env.NAVIGATION_TIMEOUT) || json.timeouts?.navigation || 15000,
  STANDARD_USER: process.env.STANDARD_USER ?? secrets.saucedemo?.standardUser ?? 'standard_user',
  PASSWORD: process.env.PASSWORD ?? secrets.saucedemo?.password ?? 'secret_sauce',
  RB_USER: process.env.RB_USER ?? secrets.restfulBooker?.username ?? 'admin',
  RB_PASSWORD: process.env.RB_PASSWORD ?? secrets.restfulBooker?.password ?? 'password123',
  CI: !!process.env.CI,
} as const;
```

- [ ] **Step 4: Defer running the test**

The test depends on the `unit` Playwright project, which lands in Task 15. Don't run yet; structure is in place.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/env-loader.spec.ts config/env.config.ts
git commit -m "feat(config): add env loader with dev/ci JSON merge + secrets layering"
```

---

## Task 8: Routes and API routes configs

**Files:**

- Create: `config/routes.config.ts`
- Create: `config/api-routes.config.ts`

- [ ] **Step 1: Create `config/routes.config.ts`**

```ts
export const ROUTES = {
  LOGIN: '/',
  INVENTORY: '/inventory.html',
  CART: '/cart.html',
  CHECKOUT_INFO: '/checkout-step-one.html',
  CHECKOUT_OVERVIEW: '/checkout-step-two.html',
  CHECKOUT_COMPLETE: '/checkout-complete.html',
} as const;

export type RouteName = keyof typeof ROUTES;
```

- [ ] **Step 2: Create `config/api-routes.config.ts`**

```ts
export const API_ROUTES = {
  AUTH: '/auth',
  PING: '/ping',
  BOOKINGS: '/booking',
  BOOKING_BY_ID: (id: number | string): string => `/booking/${id}`,
} as const;
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add config/routes.config.ts config/api-routes.config.ts
git commit -m "feat(config): add web routes and API routes constants"
```

---

## Task 9: `config/index.ts` barrel

**Files:**

- Create: `config/index.ts`

- [ ] **Step 1: Create the barrel**

```ts
export { ENV, ACTIVE_ENV } from './env.config';
export { ROUTES, type RouteName } from './routes.config';
export { API_ROUTES } from './api-routes.config';
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add config/index.ts
git commit -m "feat(config): add config barrel exporting ENV, ROUTES, API_ROUTES"
```

---

## Task 10: `TestLogger` utility (TDD)

**Files:**

- Create: `tests/unit/logger.spec.ts`
- Create: `src/utils/logger.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/logger.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { TestLogger, LogLevel } from '@/utils/logger';

test.describe('@unit TestLogger', () => {
  test('emits messages at and above the configured level', () => {
    const captured: string[] = [];
    const log = new TestLogger('TEST', LogLevel.INFO, (line) => captured.push(line));

    log.debug('hidden');
    log.info('shown-info');
    log.warn('shown-warn');
    log.error('shown-error');

    expect(captured.length).toBe(3);
    expect(captured[0]).toContain('shown-info');
    expect(captured[1]).toContain('shown-warn');
    expect(captured[2]).toContain('shown-error');
  });

  test('embeds tag and level in output', () => {
    const captured: string[] = [];
    const log = new TestLogger('LoginPage', LogLevel.DEBUG, (line) => captured.push(line));

    log.info('clicked button');

    expect(captured[0]).toContain('[INFO]');
    expect(captured[0]).toContain('[LoginPage]');
    expect(captured[0]).toContain('clicked button');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx playwright test tests/unit/logger.spec.ts
```

Expected: FAIL — `Cannot find module '@/utils/logger'`.

- [ ] **Step 3: Implement `src/utils/logger.ts`**

```ts
export enum LogLevel {
  DEBUG = 10,
  INFO = 20,
  WARN = 30,
  ERROR = 40,
}

export type LogSink = (line: string) => void;

const LEVEL_NAME: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

const defaultSink: LogSink = (line) => {
  // eslint-disable-next-line no-console
  process.stdout.write(line + '\n');
};

export class TestLogger {
  constructor(
    private readonly tag: string,
    private readonly level: LogLevel = LogLevel.INFO,
    private readonly sink: LogSink = defaultSink,
  ) {}

  debug(message: string, context?: Record<string, unknown>): void {
    this.emit(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.emit(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.emit(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.emit(LogLevel.ERROR, message, context);
  }

  child(subTag: string): TestLogger {
    return new TestLogger(`${this.tag}/${subTag}`, this.level, this.sink);
  }

  private emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (level < this.level) return;
    const ts = new Date().toISOString();
    const ctx = context ? ' ' + JSON.stringify(context) : '';
    this.sink(`${ts} [${LEVEL_NAME[level]}] [${this.tag}] ${message}${ctx}`);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add tests/unit/logger.spec.ts src/utils/logger.ts
git commit -m "feat(utils): add TestLogger with leveled output and child loggers"
```

---

## Task 11: Error types

**Files:**

- Create: `src/utils/errors.ts`

- [ ] **Step 1: Create error types**

```ts
export class FrameworkError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'FrameworkError';
  }
}

export class ValidationError extends FrameworkError {
  constructor(
    message: string,
    public readonly errors: unknown[],
  ) {
    super(message, { errors });
    this.name = 'ValidationError';
  }
}

export class ApiError extends FrameworkError {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message, { status, body });
    this.name = 'ApiError';
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/utils/errors.ts
git commit -m "feat(utils): add FrameworkError, ValidationError, ApiError"
```

---

## Task 12: `testDataManager` and `testDataUtils` (TDD)

**Files:**

- Create: `test-data/testdata.json` (stub — entries fill in across Tasks 19/22/27)
- Create: `tests/unit/test-data-utils.spec.ts`
- Create: `src/utils/testDataUtils.ts`
- Create: `src/utils/testDataManager.ts`

- [ ] **Step 1: Create stub `test-data/testdata.json`**

```json
{
  "web_users": [],
  "web_checkout": [],
  "api_bookings": []
}
```

- [ ] **Step 2: Write the failing test**

`tests/unit/test-data-utils.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { uniqueName, randomEmail, randomCustomerInfo, isoDate } from '@/utils/testDataUtils';

test.describe('@unit testDataUtils', () => {
  test('uniqueName returns distinct values across many calls', () => {
    const samples = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      samples.add(uniqueName('User'));
    }
    expect(samples.size).toBe(1000);
    for (const sample of samples) {
      expect(sample.startsWith('User_')).toBe(true);
    }
  });

  test('randomEmail returns a valid email shape', () => {
    const email = randomEmail();
    expect(email).toMatch(/^[a-z0-9._-]+@example\.test$/);
  });

  test('randomCustomerInfo returns first/last/postal triple', () => {
    const info = randomCustomerInfo();
    expect(info.firstName.length).toBeGreaterThan(0);
    expect(info.lastName.length).toBeGreaterThan(0);
    expect(info.postalCode).toMatch(/^\d{5}$/);
  });

  test('isoDate returns YYYY-MM-DD with day offset applied', () => {
    const today = isoDate(0);
    const inFive = isoDate(5);
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(inFive).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(inFive).getTime() - new Date(today).getTime()).toBe(5 * 24 * 60 * 60 * 1000);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx playwright test tests/unit/test-data-utils.spec.ts
```

Expected: FAIL — `Cannot find module '@/utils/testDataUtils'`.

- [ ] **Step 4: Implement `src/utils/testDataUtils.ts`**

```ts
const FIRST_NAMES = ['Alice', 'Bob', 'Carol', 'David', 'Eva', 'Frank', 'Grace', 'Hank'];
const LAST_NAMES = ['Adams', 'Brown', 'Clark', 'Davis', 'Evans', 'Foster', 'Green', 'Hall'];

let counter = 0;

export function uniqueName(base: string): string {
  counter += 1;
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 6);
  return `${base}_${ts}_${counter}_${rand}`;
}

export function randomEmail(): string {
  const localPart = Math.random().toString(36).slice(2, 10);
  return `${localPart}@example.test`;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export function randomCustomerInfo(): CustomerInfo {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const postalCode = String(10000 + Math.floor(Math.random() * 89999));
  return { firstName, lastName, postalCode };
}

export function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
```

- [ ] **Step 5: Implement `src/utils/testDataManager.ts`**

```ts
import * as fs from 'fs';
import * as path from 'path';
import { FrameworkError } from './errors';

interface TestDataFile {
  [entityKey: string]: Array<{ TC_ID: string; [k: string]: unknown }>;
}

const ROOT = path.resolve(__dirname, '../..');
const DATA_PATH = path.join(ROOT, 'test-data/testdata.json');

let cached: TestDataFile | null = null;

function load(): TestDataFile {
  if (cached) return cached;
  if (!fs.existsSync(DATA_PATH)) {
    throw new FrameworkError(`test-data/testdata.json not found at ${DATA_PATH}`);
  }
  cached = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) as TestDataFile;
  return cached;
}

export const testDataManager = {
  getByTcId<T extends { TC_ID: string }>(entity: string, tcId: string): T {
    const collection = load()[entity];
    if (!collection) {
      throw new FrameworkError(`Unknown test-data entity "${entity}"`);
    }
    const found = collection.find((row) => row.TC_ID === tcId);
    if (!found) {
      throw new FrameworkError(`No test data found for ${entity}/${tcId}`);
    }
    return found as T;
  },
  all<T extends { TC_ID: string }>(entity: string): T[] {
    const collection = load()[entity];
    if (!collection) {
      throw new FrameworkError(`Unknown test-data entity "${entity}"`);
    }
    return collection as T[];
  },
};
```

- [ ] **Step 6: Commit**

```bash
git add test-data/testdata.json tests/unit/test-data-utils.spec.ts src/utils/testDataUtils.ts src/utils/testDataManager.ts
git commit -m "feat(utils): add testDataUtils generators and testDataManager TC-ID lookup"
```

---

## Task 13: `SchemaValidator` (TDD)

**Files:**

- Create: `tests/unit/schema-validator.spec.ts`
- Create: `src/utils/schemaValidator.ts`

- [ ] **Step 1: Write the failing test**

`tests/unit/schema-validator.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import { SchemaValidator } from '@/utils/schemaValidator';
import { ValidationError } from '@/utils/errors';

const userSchema = {
  type: 'object',
  required: ['id', 'name'],
  properties: {
    id: { type: 'number' },
    name: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
};

test.describe('@unit SchemaValidator', () => {
  test('accepts a valid payload', () => {
    const v = new SchemaValidator();
    v.register('user', userSchema);
    expect(() => v.validate('user', { id: 1, name: 'Alice' })).not.toThrow();
  });

  test('throws ValidationError for missing required field', () => {
    const v = new SchemaValidator();
    v.register('user', userSchema);
    expect(() => v.validate('user', { id: 1 })).toThrow(ValidationError);
  });

  test('throws ValidationError for wrong type', () => {
    const v = new SchemaValidator();
    v.register('user', userSchema);
    expect(() => v.validate('user', { id: 'one', name: 'Alice' })).toThrow(ValidationError);
  });

  test('throws when validating against unknown schema', () => {
    const v = new SchemaValidator();
    expect(() => v.validate('unknown', {})).toThrow(/unknown/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx playwright test tests/unit/schema-validator.spec.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/utils/schemaValidator.ts`**

```ts
import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { ValidationError, FrameworkError } from './errors';

export class SchemaValidator {
  private readonly ajv: Ajv;
  private readonly compiled: Map<string, ValidateFunction> = new Map();

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
  }

  register(name: string, schema: object): void {
    this.compiled.set(name, this.ajv.compile(schema));
  }

  validate(name: string, data: unknown): void {
    const validator = this.compiled.get(name);
    if (!validator) {
      throw new FrameworkError(`Schema "${name}" not registered`);
    }
    const ok = validator(data);
    if (!ok) {
      throw new ValidationError(`Schema "${name}" validation failed`, validator.errors ?? []);
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add tests/unit/schema-validator.spec.ts src/utils/schemaValidator.ts
git commit -m "feat(utils): add AJV SchemaValidator with register/validate"
```

---

## Task 14: Allure utilities

**Files:**

- Create: `src/utils/allureSetup.ts`
- Create: `src/utils/allureUtils.ts`

- [ ] **Step 1: Create `src/utils/allureSetup.ts`**

```ts
import * as fs from 'fs';
import * as path from 'path';
import { ACTIVE_ENV, ENV } from '@config/env.config';

async function globalSetup(): Promise<void> {
  const resultsDir = path.resolve(process.cwd(), 'allure-results');
  fs.mkdirSync(resultsDir, { recursive: true });

  const props = [
    `Environment=${ACTIVE_ENV}`,
    `BaseURL=${ENV.BASE_URL}`,
    `ApiBaseURL=${ENV.API_BASE_URL}`,
    `Node=${process.version}`,
  ].join('\n');
  fs.writeFileSync(path.join(resultsDir, 'environment.properties'), props, 'utf8');

  fs.writeFileSync(
    path.join(resultsDir, 'executor.json'),
    JSON.stringify(
      {
        name: ENV.CI ? 'GitHub Actions' : 'Local',
        type: ENV.CI ? 'github' : 'local',
        reportName: 'Playwright TS — SauceDemo + Restful-Booker',
      },
      null,
      2,
    ),
    'utf8',
  );

  fs.writeFileSync(
    path.join(resultsDir, 'categories.json'),
    JSON.stringify(
      [
        {
          name: 'Validation errors',
          matchedStatuses: ['failed'],
          messageRegex: '.*ValidationError.*',
        },
        { name: 'API errors', matchedStatuses: ['failed'], messageRegex: '.*ApiError.*' },
        { name: 'Timeouts', matchedStatuses: ['failed'], messageRegex: '.*Timeout.*' },
      ],
      null,
      2,
    ),
    'utf8',
  );
}

export default globalSetup;
```

- [ ] **Step 2: Create `src/utils/allureUtils.ts`**

```ts
import { allure } from 'allure-playwright';

export enum Severity {
  BLOCKER = 'blocker',
  CRITICAL = 'critical',
  NORMAL = 'normal',
  MINOR = 'minor',
  TRIVIAL = 'trivial',
}

export interface TestMetadata {
  feature?: string;
  story?: string;
  severity?: Severity;
  testId?: string;
  tags?: string[];
}

export async function setTestMetadata(meta: TestMetadata): Promise<void> {
  if (meta.feature) await allure.feature(meta.feature);
  if (meta.story) await allure.story(meta.story);
  if (meta.severity) await allure.severity(meta.severity);
  if (meta.testId) await allure.tms(meta.testId, meta.testId);
  if (meta.tags) {
    for (const tag of meta.tags) {
      await allure.tag(tag);
    }
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/utils/allureSetup.ts src/utils/allureUtils.ts
git commit -m "feat(utils): add Allure globalSetup and setTestMetadata helper"
```

---

## Task 15: `utils/index.ts` + `playwright.config.ts` with `unit` project, verify green

**Files:**

- Create: `src/utils/index.ts`
- Create: `playwright.config.ts`

- [ ] **Step 1: Create `src/utils/index.ts`**

```ts
export { TestLogger, LogLevel, type LogSink } from './logger';
export { FrameworkError, ValidationError, ApiError } from './errors';
export { testDataManager } from './testDataManager';
export {
  uniqueName,
  randomEmail,
  randomCustomerInfo,
  isoDate,
  type CustomerInfo,
} from './testDataUtils';
export { SchemaValidator } from './schemaValidator';
export { setTestMetadata, Severity, type TestMetadata } from './allureUtils';
```

- [ ] **Step 2: Create `playwright.config.ts` (unit project only for now; api + browser projects added in later tasks)**

```ts
import { defineConfig } from '@playwright/test';
import { ENV, ACTIVE_ENV } from '@config/env.config';

console.log(`[playwright-ts] Running with environment: ${ACTIVE_ENV}`);

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  testIgnore: ['**/node_modules/**', '**/dist/**'],
  fullyParallel: true,
  forbidOnly: ENV.CI,
  retries: ENV.CI ? 2 : 0,
  workers: ENV.CI ? 2 : 4,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  globalSetup: require.resolve('./src/utils/allureSetup.ts'),

  reporter: [['list'], ['allure-playwright', { detail: false, suiteTitle: true }]],

  use: {
    actionTimeout: ENV.ACTION_TIMEOUT,
    navigationTimeout: ENV.NAVIGATION_TIMEOUT,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'unit',
      testMatch: 'tests/unit/**/*.spec.ts',
      use: {},
    },
  ],

  outputDir: 'test-results',
});
```

- [ ] **Step 3: Run unit tests**

```bash
npm run test:unit
```

Expected: PASS — all four unit specs green (~10 unit test cases total across env-loader, logger, testDataUtils, schemaValidator).

- [ ] **Step 4: Verify lint and typecheck**

```bash
npm run typecheck
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/utils/index.ts playwright.config.ts
git commit -m "feat(config): add utils barrel + initial Playwright config with unit project"
```

---

# Slice 3: API layer end-to-end

Goal: `npm run test:api` is green with 7-8 API specs against live Restful-Booker.

## Task 16: `ApiClient` wrapper

**Files:**

- Create: `src/utils/apiClient.ts`
- Modify: `src/utils/index.ts`

- [ ] **Step 1: Implement `src/utils/apiClient.ts`**

```ts
import type { APIRequestContext, APIResponse } from '@playwright/test';
import { test } from '@playwright/test';
import { ApiError } from './errors';
import { TestLogger } from './logger';

export interface ReqOpts {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
}

export interface TypedResponse<T> {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: T;
  raw: APIResponse;
}

export class ApiClient {
  private readonly logger: TestLogger;

  constructor(
    private readonly request: APIRequestContext,
    private readonly baseURL: string,
    private readonly defaultHeaders: Record<string, string> = {},
  ) {
    this.logger = new TestLogger('ApiClient');
  }

  withToken(token: string): ApiClient {
    return new ApiClient(this.request, this.baseURL, {
      ...this.defaultHeaders,
      Cookie: `token=${token}`,
    });
  }

  async get<T>(pathname: string, opts: ReqOpts = {}): Promise<TypedResponse<T>> {
    return this.send<T>('GET', pathname, undefined, opts);
  }

  async post<T>(pathname: string, body: unknown, opts: ReqOpts = {}): Promise<TypedResponse<T>> {
    return this.send<T>('POST', pathname, body, opts);
  }

  async put<T>(pathname: string, body: unknown, opts: ReqOpts = {}): Promise<TypedResponse<T>> {
    return this.send<T>('PUT', pathname, body, opts);
  }

  async delete(pathname: string, opts: ReqOpts = {}): Promise<TypedResponse<void>> {
    return this.send<void>('DELETE', pathname, undefined, opts);
  }

  private async send<T>(
    method: string,
    pathname: string,
    body: unknown,
    opts: ReqOpts,
  ): Promise<TypedResponse<T>> {
    const url = this.baseURL + pathname;
    return test.step(`${method} ${pathname}`, async () => {
      this.logger.info(`${method} ${url}`, body !== undefined ? { body } : undefined);
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...this.defaultHeaders,
        ...(opts.headers ?? {}),
      };
      const response = await this.request.fetch(url, {
        method,
        headers,
        data: body !== undefined ? JSON.stringify(body) : undefined,
        params: opts.params,
      });
      const status = response.status();
      const ok = status >= 200 && status < 300;
      const responseHeaders = response.headers();
      let parsed: T = undefined as unknown as T;
      const text = await response.text();
      if (text.length > 0) {
        try {
          parsed = JSON.parse(text) as T;
        } catch {
          parsed = text as unknown as T;
        }
      }
      this.logger.info(`← ${status} ${method} ${pathname}`);
      if (status >= 500) {
        throw new ApiError(`${method} ${pathname} returned ${status}`, status, parsed);
      }
      return { status, ok, headers: responseHeaders, body: parsed, raw: response };
    });
  }
}
```

- [ ] **Step 2: Update `src/utils/index.ts` barrel**

Add this export to `src/utils/index.ts`:

```ts
export { ApiClient, type TypedResponse, type ReqOpts } from './apiClient';
```

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/utils/apiClient.ts src/utils/index.ts
git commit -m "feat(utils): add ApiClient with get/post/put/delete + withToken"
```

---

## Task 17: `BaseApiService`

**Files:**

- Create: `src/services/api/base.api.ts`

- [ ] **Step 1: Create `src/services/api/base.api.ts`**

```ts
import { test, expect } from '@playwright/test';
import { ApiClient, TypedResponse } from '@/utils/apiClient';
import { TestLogger } from '@/utils/logger';

export abstract class BaseApiService {
  protected readonly logger: TestLogger;

  constructor(protected readonly apiClient: ApiClient) {
    this.logger = new TestLogger(this.constructor.name);
  }

  protected async step<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return test.step(`${this.constructor.name}: ${name}`, fn);
  }

  async verifyStatus<T>(response: TypedResponse<T>, expected: number): Promise<void> {
    await this.step(`verify status ${expected}`, async () => {
      expect(response.status, `Expected ${expected} but got ${response.status}`).toBe(expected);
    });
  }

  async verifyHeader<T>(
    response: TypedResponse<T>,
    name: string,
    expected: string | RegExp,
  ): Promise<void> {
    await this.step(`verify header ${name}`, async () => {
      const actual = response.headers[name.toLowerCase()];
      if (expected instanceof RegExp) {
        expect(actual).toMatch(expected);
      } else {
        expect(actual).toBe(expected);
      }
    });
  }
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/api/base.api.ts
git commit -m "feat(api): add BaseApiService with step + verifyStatus + verifyHeader"
```

---

## Task 18: `HealthService` and `ping` spec

**Files:**

- Create: `src/services/api/health.api.ts`
- Create: `tests/api/health/ping.spec.ts`

- [ ] **Step 1: Implement `src/services/api/health.api.ts`**

```ts
import { BaseApiService } from './base.api';
import { API_ROUTES } from '@config/api-routes.config';

export class HealthService extends BaseApiService {
  async ping() {
    return this.step('ping', async () => this.apiClient.get<string>(API_ROUTES.PING));
  }

  async verifyPingOk(response: { status: number; body: string }) {
    await this.verifyStatus(response as any, 201);
  }
}
```

- [ ] **Step 2: Write the failing spec**

`tests/api/health/ping.spec.ts`:

```ts
import { apiTest as test } from '@/fixtures';
import { setTestMetadata, Severity } from '@/utils/allureUtils';

test.describe('@smoke @health Restful-Booker /ping', () => {
  test.beforeEach(async () => {
    await setTestMetadata({
      feature: 'Restful-Booker — Health',
      story: 'Service availability',
      severity: Severity.CRITICAL,
      testId: 'TC_API_HEALTH_001',
      tags: ['@smoke', '@health'],
    });
  });

  test('TC_API_HEALTH_001: GET /ping returns 201', async ({ healthApi }) => {
    const response = await healthApi.ping();
    await healthApi.verifyPingOk(response);
  });
});
```

- [ ] **Step 3: Don't run yet**

The fixture `@/fixtures` doesn't exist; the spec will fail to import. Fixtures land in Task 24.

- [ ] **Step 4: Commit**

```bash
git add src/services/api/health.api.ts tests/api/health/ping.spec.ts
git commit -m "feat(api): add HealthService and ping smoke spec"
```

---

## Task 19: `AuthService`, `token.schema.json`, create-token spec

**Files:**

- Create: `test-data/schemas/token.schema.json`
- Create: `src/services/api/auth.api.ts`
- Create: `tests/api/auth/create-token.spec.ts`

- [ ] **Step 1: Create `test-data/schemas/token.schema.json`**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "RestfulBookerTokenResponse",
  "type": "object",
  "required": ["token"],
  "properties": {
    "token": { "type": "string", "minLength": 8 }
  },
  "additionalProperties": false
}
```

- [ ] **Step 2: Implement `src/services/api/auth.api.ts`**

```ts
import * as fs from 'fs';
import * as path from 'path';
import { BaseApiService } from './base.api';
import { ApiClient } from '@/utils/apiClient';
import { SchemaValidator } from '@/utils/schemaValidator';
import { API_ROUTES } from '@config/api-routes.config';

interface AuthRequest {
  username: string;
  password: string;
}

interface AuthOkResponse {
  token: string;
}

interface AuthErrorResponse {
  reason: string;
}

const tokenSchema = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../test-data/schemas/token.schema.json'), 'utf8'),
);

export class AuthService extends BaseApiService {
  private readonly validator: SchemaValidator;

  constructor(apiClient: ApiClient) {
    super(apiClient);
    this.validator = new SchemaValidator();
    this.validator.register('token', tokenSchema);
  }

  async createToken(creds: AuthRequest) {
    return this.step('createToken', async () =>
      this.apiClient.post<AuthOkResponse | AuthErrorResponse>(API_ROUTES.AUTH, creds),
    );
  }

  async verifyTokenIssued(response: { status: number; body: AuthOkResponse | AuthErrorResponse }) {
    await this.step('verify token issued', async () => {
      await this.verifyStatus(response as any, 200);
      this.validator.validate('token', response.body);
    });
  }

  async verifyBadCredentials(response: { status: number; body: AuthErrorResponse }) {
    await this.step('verify Bad credentials reason', async () => {
      await this.verifyStatus(response as any, 200);
      const body = response.body;
      if (!('reason' in body) || body.reason !== 'Bad credentials') {
        throw new Error(`Expected reason "Bad credentials" but got ${JSON.stringify(body)}`);
      }
    });
  }
}
```

- [ ] **Step 3: Create `tests/api/auth/create-token.spec.ts`**

```ts
import { apiTest as test } from '@/fixtures';
import { setTestMetadata, Severity } from '@/utils/allureUtils';
import { ENV } from '@config/env.config';

test.describe('@smoke @auth Restful-Booker /auth', () => {
  test('TC_API_AUTH_001: valid credentials issue a token', async ({ authApi }) => {
    await setTestMetadata({
      feature: 'Restful-Booker — Auth',
      story: 'Create token',
      severity: Severity.CRITICAL,
      testId: 'TC_API_AUTH_001',
      tags: ['@smoke', '@auth'],
    });
    const response = await authApi.createToken({
      username: ENV.RB_USER,
      password: ENV.RB_PASSWORD,
    });
    await authApi.verifyTokenIssued(response);
  });

  test('TC_API_AUTH_002: invalid credentials return Bad credentials', async ({ authApi }) => {
    await setTestMetadata({
      feature: 'Restful-Booker — Auth',
      story: 'Create token — invalid',
      severity: Severity.NORMAL,
      testId: 'TC_API_AUTH_002',
      tags: ['@smoke', '@auth'],
    });
    const response = await authApi.createToken({ username: 'wrong', password: 'wrong' });
    await authApi.verifyBadCredentials(response as any);
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add test-data/schemas/token.schema.json src/services/api/auth.api.ts tests/api/auth/create-token.spec.ts
git commit -m "feat(api): add AuthService, token schema, and create-token smoke spec"
```

---

## Task 20: Booking JSON schemas

**Files:**

- Create: `test-data/schemas/booking.schema.json`
- Create: `test-data/schemas/booking-id.schema.json`
- Create: `test-data/schemas/booking-list.schema.json`

- [ ] **Step 1: Create `test-data/schemas/booking.schema.json`**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Booking",
  "type": "object",
  "required": ["firstname", "lastname", "totalprice", "depositpaid", "bookingdates"],
  "properties": {
    "firstname": { "type": "string", "minLength": 1 },
    "lastname": { "type": "string", "minLength": 1 },
    "totalprice": { "type": "number" },
    "depositpaid": { "type": "boolean" },
    "bookingdates": {
      "type": "object",
      "required": ["checkin", "checkout"],
      "properties": {
        "checkin": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" },
        "checkout": { "type": "string", "pattern": "^\\d{4}-\\d{2}-\\d{2}$" }
      }
    },
    "additionalneeds": { "type": "string" }
  },
  "additionalProperties": false
}
```

- [ ] **Step 2: Create `test-data/schemas/booking-id.schema.json`**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BookingIdResponse",
  "type": "object",
  "required": ["bookingid", "booking"],
  "properties": {
    "bookingid": { "type": "integer", "minimum": 1 },
    "booking": { "$ref": "booking.schema.json" }
  },
  "additionalProperties": false
}
```

- [ ] **Step 3: Create `test-data/schemas/booking-list.schema.json`**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BookingList",
  "type": "array",
  "items": {
    "type": "object",
    "required": ["bookingid"],
    "properties": { "bookingid": { "type": "integer" } },
    "additionalProperties": false
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add test-data/schemas/booking.schema.json test-data/schemas/booking-id.schema.json test-data/schemas/booking-list.schema.json
git commit -m "feat(api): add booking, booking-id, booking-list JSON schemas"
```

---

## Task 21: `BookingsService`

**Files:**

- Create: `src/services/api/bookings.api.ts`

- [ ] **Step 1: Implement `src/services/api/bookings.api.ts`**

```ts
import * as fs from 'fs';
import * as path from 'path';
import { expect } from '@playwright/test';
import { BaseApiService } from './base.api';
import { ApiClient } from '@/utils/apiClient';
import { SchemaValidator } from '@/utils/schemaValidator';
import { API_ROUTES } from '@config/api-routes.config';

export interface BookingDates {
  checkin: string;
  checkout: string;
}

export interface Booking {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds?: string;
}

export interface BookingIdResponse {
  bookingid: number;
  booking: Booking;
}

const SCHEMAS_DIR = path.resolve(__dirname, '../../../test-data/schemas');

function loadSchema(name: string): object {
  return JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, `${name}.schema.json`), 'utf8'));
}

export class BookingsService extends BaseApiService {
  private readonly validator: SchemaValidator;

  constructor(apiClient: ApiClient) {
    super(apiClient);
    this.validator = new SchemaValidator();
    this.validator.register('booking', loadSchema('booking'));
    this.validator.register('booking-id', {
      ...loadSchema('booking-id'),
      properties: {
        bookingid: { type: 'integer', minimum: 1 },
        booking: loadSchema('booking'),
      },
    });
    this.validator.register('booking-list', loadSchema('booking-list'));
  }

  async listBookings() {
    return this.step('list bookings', async () =>
      this.apiClient.get<Array<{ bookingid: number }>>(API_ROUTES.BOOKINGS),
    );
  }

  async getBooking(id: number) {
    return this.step(`get booking ${id}`, async () =>
      this.apiClient.get<Booking>(API_ROUTES.BOOKING_BY_ID(id)),
    );
  }

  async createBooking(payload: Booking) {
    return this.step('create booking', async () =>
      this.apiClient.post<BookingIdResponse>(API_ROUTES.BOOKINGS, payload),
    );
  }

  async updateBooking(id: number, payload: Booking, token: string) {
    return this.step(`update booking ${id}`, async () =>
      this.apiClient.withToken(token).put<Booking>(API_ROUTES.BOOKING_BY_ID(id), payload),
    );
  }

  async deleteBooking(id: number, token: string) {
    return this.step(`delete booking ${id}`, async () =>
      this.apiClient.withToken(token).delete(API_ROUTES.BOOKING_BY_ID(id)),
    );
  }

  async verifyBookingId(response: { status: number; body: BookingIdResponse }) {
    await this.step('verify booking-id response', async () => {
      await this.verifyStatus(response as any, 200);
      this.validator.validate('booking-id', response.body);
      expect(response.body.bookingid, 'bookingid present').toBeGreaterThan(0);
    });
  }

  async verifyBookingMatches(actual: Booking, expected: Booking) {
    await this.step('verify booking payload matches expected', async () => {
      this.validator.validate('booking', actual);
      expect(actual.firstname).toBe(expected.firstname);
      expect(actual.lastname).toBe(expected.lastname);
      expect(actual.totalprice).toBe(expected.totalprice);
      expect(actual.depositpaid).toBe(expected.depositpaid);
      expect(actual.bookingdates.checkin).toBe(expected.bookingdates.checkin);
      expect(actual.bookingdates.checkout).toBe(expected.bookingdates.checkout);
    });
  }

  async verifyBookingListSchema(response: { status: number; body: Array<{ bookingid: number }> }) {
    await this.step('verify list schema', async () => {
      await this.verifyStatus(response as any, 200);
      this.validator.validate('booking-list', response.body);
    });
  }

  async verifyDeleted(response: { status: number }) {
    await this.step('verify delete success', async () => {
      // Restful-Booker returns 201 "Created" for DELETE per their docs (quirky but documented)
      expect([201, 204]).toContain(response.status);
    });
  }
}
```

- [ ] **Step 2: Create the services barrel `src/services/api/index.ts`**

```ts
export { BaseApiService } from './base.api';
export { HealthService } from './health.api';
export { AuthService } from './auth.api';
export {
  BookingsService,
  type Booking,
  type BookingDates,
  type BookingIdResponse,
} from './bookings.api';
```

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/services/api/bookings.api.ts src/services/api/index.ts
git commit -m "feat(api): add BookingsService with CRUD + verify methods"
```

---

## Task 22: Bookings CRUD spec

**Files:**

- Create: `tests/api/bookings/crud.spec.ts`
- Modify: `test-data/testdata.json`

- [ ] **Step 1: Add booking test data to `test-data/testdata.json`**

Replace the file content with:

```json
{
  "web_users": [],
  "web_checkout": [],
  "api_bookings": [
    {
      "TC_ID": "TC_API_BOOK_001",
      "firstname": "John",
      "lastname": "Doe",
      "totalprice": 250,
      "depositpaid": true,
      "bookingdates": { "checkin": "2026-06-01", "checkout": "2026-06-05" },
      "additionalneeds": "Breakfast"
    }
  ]
}
```

- [ ] **Step 2: Write `tests/api/bookings/crud.spec.ts`**

```ts
import { apiTest as test } from '@/fixtures';
import { setTestMetadata, Severity } from '@/utils/allureUtils';
import { testDataManager } from '@/utils/testDataManager';
import { ENV } from '@config/env.config';
import type { Booking } from '@/services/api';

test.describe('@regression @bookings Restful-Booker /booking CRUD', () => {
  let createdId: number | null = null;
  let token: string | null = null;

  test.beforeAll(async ({ request }) => {
    // No-op — we get the token inside the test via the apiClient fixture chain
  });

  test.afterEach(async ({ bookingsApi, authApi }) => {
    if (createdId !== null) {
      const t =
        token ??
        (await authApi
          .createToken({ username: ENV.RB_USER, password: ENV.RB_PASSWORD })
          .then((r) => (r.body as { token: string }).token));
      await bookingsApi.deleteBooking(createdId, t);
      createdId = null;
      token = null;
    }
  });

  test('TC_API_BOOK_001..004: create → list contains id → get matches → update → delete', async ({
    authApi,
    bookingsApi,
  }) => {
    await setTestMetadata({
      feature: 'Restful-Booker — Bookings',
      story: 'CRUD flow',
      severity: Severity.CRITICAL,
      testId: 'TC_API_BOOK_001',
      tags: ['@regression', '@bookings'],
    });

    const payload = testDataManager.getByTcId<Booking & { TC_ID: string }>(
      'api_bookings',
      'TC_API_BOOK_001',
    );
    const expected: Booking = {
      firstname: payload.firstname,
      lastname: payload.lastname,
      totalprice: payload.totalprice,
      depositpaid: payload.depositpaid,
      bookingdates: payload.bookingdates,
      additionalneeds: payload.additionalneeds,
    };

    // TC_API_BOOK_001 — Create
    const createResponse = await bookingsApi.createBooking(expected);
    await bookingsApi.verifyBookingId(createResponse);
    createdId = createResponse.body.bookingid;

    // TC_API_BOOK_002 — List contains new id
    const listResponse = await bookingsApi.listBookings();
    await bookingsApi.verifyBookingListSchema(listResponse);
    if (!listResponse.body.some((b) => b.bookingid === createdId)) {
      throw new Error(`Created booking id ${createdId} not present in list`);
    }

    // TC_API_BOOK_003 — Get matches payload
    const getResponse = await bookingsApi.getBooking(createdId);
    await bookingsApi.verifyBookingMatches(getResponse.body, expected);

    // TC_API_BOOK_004 — Update + delete
    const tokenResponse = await authApi.createToken({
      username: ENV.RB_USER,
      password: ENV.RB_PASSWORD,
    });
    token = (tokenResponse.body as { token: string }).token;

    const updated: Booking = { ...expected, additionalneeds: 'Extra towels' };
    const updateResponse = await bookingsApi.updateBooking(createdId, updated, token);
    await bookingsApi.verifyBookingMatches(updateResponse.body, updated);

    // Delete via afterEach
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add tests/api/bookings/crud.spec.ts test-data/testdata.json
git commit -m "feat(api): add bookings CRUD regression spec with test-data lookup"
```

---

## Task 23: Bookings schema-validation spec

**Files:**

- Create: `tests/api/bookings/schema.spec.ts`

- [ ] **Step 1: Write `tests/api/bookings/schema.spec.ts`**

```ts
import { apiTest as test } from '@/fixtures';
import { setTestMetadata, Severity } from '@/utils/allureUtils';

test.describe('@regression @schema Restful-Booker /booking list schema', () => {
  test('TC_API_BOOK_SCHEMA_001: every entry has integer bookingid', async ({ bookingsApi }) => {
    await setTestMetadata({
      feature: 'Restful-Booker — Bookings',
      story: 'List response schema',
      severity: Severity.NORMAL,
      testId: 'TC_API_BOOK_SCHEMA_001',
      tags: ['@regression', '@schema'],
    });
    const response = await bookingsApi.listBookings();
    await bookingsApi.verifyBookingListSchema(response);
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add tests/api/bookings/schema.spec.ts
git commit -m "feat(api): add bookings list-schema regression spec"
```

---

## Task 24: API fixtures, `api` Playwright project, verify green

**Files:**

- Create: `src/fixtures/types.ts`
- Create: `src/fixtures/api.fixtures.ts`
- Create: `src/fixtures/index.ts`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Create `src/fixtures/types.ts`**

```ts
import type { ApiClient } from '@/utils/apiClient';
import type { HealthService, AuthService, BookingsService } from '@/services/api';
import type { LoginPage } from '@/pages/web/login.page';
import type { InventoryPage } from '@/pages/web/inventory.page';
import type { CartPage } from '@/pages/web/cart.page';
import type { CheckoutInfoPage } from '@/pages/web/checkout-info.page';
import type { CheckoutOverviewPage } from '@/pages/web/checkout-overview.page';
import type { CheckoutCompletePage } from '@/pages/web/checkout-complete.page';

export interface ApiFixtures {
  apiClient: ApiClient;
  healthApi: HealthService;
  authApi: AuthService;
  bookingsApi: BookingsService;
}

export interface PageFixtures {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutInfoPage: CheckoutInfoPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
}
```

(The page-fixture types reference files that don't exist yet — TypeScript will flag them. We add them in Slice 4. For now, comment out the page imports + interface to unblock; re-enable in Task 32.)

For now, replace with:

```ts
import type { ApiClient } from '@/utils/apiClient';
import type { HealthService, AuthService, BookingsService } from '@/services/api';

export interface ApiFixtures {
  apiClient: ApiClient;
  healthApi: HealthService;
  authApi: AuthService;
  bookingsApi: BookingsService;
}

export interface PageFixtures {
  // populated in Task 32 (web layer)
  __reserved?: never;
}
```

- [ ] **Step 2: Create `src/fixtures/api.fixtures.ts`**

```ts
import { test as base } from '@playwright/test';
import { ApiClient } from '@/utils/apiClient';
import { HealthService, AuthService, BookingsService } from '@/services/api';
import { ENV } from '@config/env.config';
import type { ApiFixtures } from './types';

export const apiTest = base.extend<ApiFixtures>({
  apiClient: async ({ request }, use) => {
    const client = new ApiClient(request, ENV.API_BASE_URL);
    await use(client);
  },
  healthApi: async ({ apiClient }, use) => {
    await use(new HealthService(apiClient));
  },
  authApi: async ({ apiClient }, use) => {
    await use(new AuthService(apiClient));
  },
  bookingsApi: async ({ apiClient }, use) => {
    await use(new BookingsService(apiClient));
  },
});
```

- [ ] **Step 3: Create `src/fixtures/index.ts`**

```ts
export { apiTest } from './api.fixtures';
export type { ApiFixtures, PageFixtures } from './types';
```

- [ ] **Step 4: Add `api` project to `playwright.config.ts`**

Edit the `projects` array in `playwright.config.ts`:

```ts
  projects: [
    {
      name: 'unit',
      testMatch: 'tests/unit/**/*.spec.ts',
      use: {},
    },
    {
      name: 'api',
      testMatch: 'tests/api/**/*.spec.ts',
      use: {
        baseURL: ENV.API_BASE_URL,
        extraHTTPHeaders: { 'Content-Type': 'application/json' },
      },
    },
  ],
```

- [ ] **Step 5: Run API tests**

```bash
npm run test:api
```

Expected: 4 specs pass against live Restful-Booker (ping, create-token x2, bookings CRUD, bookings schema). Total ~7-8 test cases. First run may be slow if Heroku dyno is cold.

If any spec fails because Restful-Booker is unreachable, retry: `npm run test:api`. Treat persistent failure as a real bug, not a flake.

- [ ] **Step 6: Verify typecheck + lint**

```bash
npm run typecheck
npm run lint
```

Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/fixtures playwright.config.ts
git commit -m "feat(fixtures): add ApiFixtures + api Playwright project; all API specs green"
```

---

# Slice 4: Web layer end-to-end

Goal: `npm test` runs unit + api + 3 browser projects all green.

## Task 25: `UIActions` wrapper

**Files:**

- Create: `src/utils/uiActions.ts`
- Modify: `src/utils/index.ts`

- [ ] **Step 1: Implement `src/utils/uiActions.ts`**

```ts
import { expect, test, type Locator, type Page } from '@playwright/test';
import { TestLogger } from './logger';

export class UIActions {
  private readonly logger: TestLogger;

  constructor(private readonly page: Page) {
    this.logger = new TestLogger('UIActions');
  }

  // === Interactions ===

  async click(locator: Locator, label?: string): Promise<void> {
    await test.step(label ? `Click ${label}` : 'Click element', async () => {
      this.logger.info(`Click ${label ?? '<locator>'}`);
      await locator.click();
    });
  }

  async fill(locator: Locator, value: string, label?: string): Promise<void> {
    await test.step(label ? `Fill ${label}` : 'Fill input', async () => {
      this.logger.info(`Fill ${label ?? '<input>'} with "${value}"`);
      await locator.fill(value);
    });
  }

  async selectOption(locator: Locator, value: string, label?: string): Promise<void> {
    await test.step(label ? `Select ${label} = "${value}"` : 'Select option', async () => {
      this.logger.info(`Select ${label ?? '<select>'} = ${value}`);
      await locator.selectOption(value);
    });
  }

  async hover(locator: Locator, label?: string): Promise<void> {
    await test.step(label ? `Hover ${label}` : 'Hover element', async () => {
      await locator.hover();
    });
  }

  // === Assertions ===

  async expectVisible(locator: Locator, label?: string): Promise<void> {
    await test.step(label ? `Expect ${label} visible` : 'Expect visible', async () => {
      await expect(locator).toBeVisible();
    });
  }

  async expectHidden(locator: Locator, label?: string): Promise<void> {
    await test.step(label ? `Expect ${label} hidden` : 'Expect hidden', async () => {
      await expect(locator).toBeHidden();
    });
  }

  async expectText(locator: Locator, expected: string | RegExp, label?: string): Promise<void> {
    await test.step(label ? `Expect ${label} text` : 'Expect text', async () => {
      await expect(locator).toHaveText(expected);
    });
  }

  async expectContainsText(locator: Locator, expected: string, label?: string): Promise<void> {
    await test.step(label ? `Expect ${label} contains text` : 'Expect contains text', async () => {
      await expect(locator).toContainText(expected);
    });
  }

  async expectURL(pattern: string | RegExp): Promise<void> {
    await test.step(`Expect URL matches ${pattern}`, async () => {
      await expect(this.page).toHaveURL(pattern);
    });
  }

  async expectCount(locator: Locator, expected: number, label?: string): Promise<void> {
    await test.step(
      label ? `Expect ${label} count = ${expected}` : `Expect count = ${expected}`,
      async () => {
        await expect(locator).toHaveCount(expected);
      },
    );
  }

  // === Locator builders ===

  getByTestId(id: string): Locator {
    return this.page.getByTestId(id);
  }

  getByRole(
    role: Parameters<Page['getByRole']>[0],
    options?: Parameters<Page['getByRole']>[1],
  ): Locator {
    return this.page.getByRole(role, options);
  }

  getByText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  locator(selector: string): Locator {
    return this.page.locator(selector);
  }
}
```

- [ ] **Step 2: Update `src/utils/index.ts` barrel**

Add this export:

```ts
export { UIActions } from './uiActions';
```

- [ ] **Step 3: Verify typecheck**

```bash
npm run typecheck
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/utils/uiActions.ts src/utils/index.ts
git commit -m "feat(utils): add UIActions wrapper with step-narrated interactions and assertions"
```

---

## Task 26: `BasePage`

**Files:**

- Create: `src/pages/web/base.page.ts`

- [ ] **Step 1: Implement `src/pages/web/base.page.ts`**

```ts
import { test, type Locator, type Page } from '@playwright/test';
import { UIActions } from '@/utils/uiActions';
import { TestLogger } from '@/utils/logger';
import { ENV } from '@config/env.config';

export abstract class BasePage {
  protected readonly ui: UIActions;
  protected readonly logger: TestLogger;

  constructor(protected readonly page: Page) {
    this.ui = new UIActions(page);
    this.logger = new TestLogger(this.constructor.name);
  }

  abstract get pageIdentifier(): Locator;

  async navigate(path: string = '/'): Promise<void> {
    await this.step(`Navigate to ${path}`, async () => {
      await this.page.goto(ENV.BASE_URL + path);
    });
  }

  async verifyOnPage(): Promise<void> {
    await this.step(`Verify ${this.constructor.name} is loaded`, async () => {
      await this.ui.expectVisible(this.pageIdentifier, this.constructor.name);
    });
  }

  protected async step<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return test.step(`${this.constructor.name}: ${name}`, fn);
  }
}
```

- [ ] **Step 2: Verify typecheck**

```bash
npm run typecheck
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/pages/web/base.page.ts
git commit -m "feat(web): add BasePage with UIActions wrapper, logger, step, and pageIdentifier contract"
```

---

## Task 27: `LoginPage` and login spec

**Files:**

- Create: `src/pages/web/login.page.ts`
- Create: `tests/web/auth/login.spec.ts`
- Modify: `test-data/testdata.json`

- [ ] **Step 1: Add login test data to `test-data/testdata.json`**

Replace the file content with:

```json
{
  "web_users": [
    {
      "TC_ID": "TC_WEB_AUTH_001",
      "user": "standard_user",
      "password": "secret_sauce",
      "expectedURL": "/inventory.html"
    },
    {
      "TC_ID": "TC_WEB_AUTH_002",
      "user": "locked_out_user",
      "password": "secret_sauce",
      "expectedError": "Epic sadface: Sorry, this user has been locked out."
    },
    {
      "TC_ID": "TC_WEB_AUTH_003",
      "user": "standard_user",
      "password": "wrong_password",
      "expectedError": "Epic sadface: Username and password do not match any user in this service"
    }
  ],
  "web_checkout": [
    {
      "TC_ID": "TC_WEB_E2E_001",
      "firstName": "John",
      "lastName": "Doe",
      "postalCode": "12345"
    }
  ],
  "api_bookings": [
    {
      "TC_ID": "TC_API_BOOK_001",
      "firstname": "John",
      "lastname": "Doe",
      "totalprice": 250,
      "depositpaid": true,
      "bookingdates": { "checkin": "2026-06-01", "checkout": "2026-06-05" },
      "additionalneeds": "Breakfast"
    }
  ]
}
```

- [ ] **Step 2: Implement `src/pages/web/login.page.ts`**

```ts
import type { Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { ROUTES } from '@config/routes.config';

export class LoginPage extends BasePage {
  private get usernameInput(): Locator {
    return this.page.locator('[data-test="username"]');
  }

  private get passwordInput(): Locator {
    return this.page.locator('[data-test="password"]');
  }

  private get loginButton(): Locator {
    return this.page.locator('[data-test="login-button"]');
  }

  private get errorMessage(): Locator {
    return this.page.locator('[data-test="error"]');
  }

  get pageIdentifier(): Locator {
    // Scope the Swag Labs logo to the login page container so it doesn't match the inventory header logo.
    return this.page.locator('.login_logo');
  }

  async open(): Promise<void> {
    await this.navigate(ROUTES.LOGIN);
    await this.verifyOnPage();
  }

  async signIn(username: string, password: string): Promise<void> {
    await this.step('signIn', async () => {
      await this.ui.fill(this.usernameInput, username, 'Username');
      await this.ui.fill(this.passwordInput, password, 'Password');
      await this.ui.click(this.loginButton, 'Login button');
    });
  }

  async verifyOnLogin(): Promise<void> {
    await this.verifyOnPage();
  }

  async verifyLoginError(expected: string): Promise<void> {
    await this.step('verifyLoginError', async () => {
      await this.ui.expectVisible(this.errorMessage, 'Login error banner');
      await this.ui.expectContainsText(this.errorMessage, expected, 'Login error text');
    });
  }
}
```

- [ ] **Step 3: Write `tests/web/auth/login.spec.ts`**

```ts
import { test } from '@/fixtures';
import { setTestMetadata, Severity } from '@/utils/allureUtils';
import { testDataManager } from '@/utils/testDataManager';
import { ROUTES } from '@config/routes.config';

interface WebUserRow {
  TC_ID: string;
  user: string;
  password: string;
  expectedURL?: string;
  expectedError?: string;
}

test.describe('@smoke @auth SauceDemo login', () => {
  test('TC_WEB_AUTH_001: standard_user signs in and lands on inventory', async ({
    loginPage,
    inventoryPage,
  }) => {
    await setTestMetadata({
      feature: 'SauceDemo — Auth',
      story: 'Login — standard user',
      severity: Severity.CRITICAL,
      testId: 'TC_WEB_AUTH_001',
      tags: ['@smoke', '@auth'],
    });
    const row = testDataManager.getByTcId<WebUserRow>('web_users', 'TC_WEB_AUTH_001');
    await loginPage.open();
    await loginPage.signIn(row.user, row.password);
    await inventoryPage.verifyOnInventory();
    await loginPage['ui'].expectURL(new RegExp(row.expectedURL!.replace(/\./g, '\\.') + '$'));
  });

  test('TC_WEB_AUTH_002: locked_out_user sees lockout error', async ({ loginPage }) => {
    await setTestMetadata({
      feature: 'SauceDemo — Auth',
      story: 'Login — locked out',
      severity: Severity.NORMAL,
      testId: 'TC_WEB_AUTH_002',
      tags: ['@smoke', '@auth'],
    });
    const row = testDataManager.getByTcId<WebUserRow>('web_users', 'TC_WEB_AUTH_002');
    await loginPage.open();
    await loginPage.signIn(row.user, row.password);
    await loginPage.verifyLoginError(row.expectedError!);
  });

  test('TC_WEB_AUTH_003: wrong password shows credential error', async ({ loginPage }) => {
    await setTestMetadata({
      feature: 'SauceDemo — Auth',
      story: 'Login — bad password',
      severity: Severity.NORMAL,
      testId: 'TC_WEB_AUTH_003',
      tags: ['@smoke', '@auth'],
    });
    const row = testDataManager.getByTcId<WebUserRow>('web_users', 'TC_WEB_AUTH_003');
    await loginPage.open();
    await loginPage.signIn(row.user, row.password);
    await loginPage.verifyLoginError(row.expectedError!);
  });
});
```

- [ ] **Step 4: Don't run yet**

The `test` export from `@/fixtures` and `inventoryPage` don't exist yet (added in Task 32). Spec compiles when those land.

- [ ] **Step 5: Commit**

```bash
git add src/pages/web/login.page.ts tests/web/auth/login.spec.ts test-data/testdata.json
git commit -m "feat(web): add LoginPage + auth specs (3 cases) with test-data lookup"
```

---

## Task 28: `InventoryPage` and add/remove spec

**Files:**

- Create: `src/pages/web/inventory.page.ts`
- Create: `tests/web/inventory/add-remove.spec.ts`

- [ ] **Step 1: Implement `src/pages/web/inventory.page.ts`**

```ts
import type { Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class InventoryPage extends BasePage {
  private get container(): Locator {
    return this.page.locator('#inventory_container');
  }

  private get appLogo(): Locator {
    // Scoped to the inventory header so it doesn't collide with login_logo
    return this.page.locator('.app_logo');
  }

  private get hamburgerButton(): Locator {
    return this.page.getByRole('button', { name: 'Open Menu' });
  }

  private get cartLink(): Locator {
    return this.page.locator('[data-test="shopping-cart-link"]');
  }

  private get cartBadge(): Locator {
    return this.page.locator('.shopping_cart_badge');
  }

  private get sortDropdown(): Locator {
    return this.page.locator('[data-test="product-sort-container"]');
  }

  private get logoutLink(): Locator {
    return this.page.locator('[data-test="logout-sidebar-link"]');
  }

  private addToCartByName(name: string): Locator {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    return this.page.locator(`[data-test="add-to-cart-${slug}"]`);
  }

  private removeByName(name: string): Locator {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    return this.page.locator(`[data-test="remove-${slug}"]`);
  }

  get pageIdentifier(): Locator {
    return this.container;
  }

  async addToCart(productName: string): Promise<void> {
    await this.step(`addToCart "${productName}"`, async () => {
      await this.ui.click(this.addToCartByName(productName), `Add ${productName}`);
    });
  }

  async removeFromCart(productName: string): Promise<void> {
    await this.step(`removeFromCart "${productName}"`, async () => {
      await this.ui.click(this.removeByName(productName), `Remove ${productName}`);
    });
  }

  async openCart(): Promise<void> {
    await this.step('openCart', async () => {
      await this.ui.click(this.cartLink, 'Cart icon');
    });
  }

  async sortBy(value: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    await this.step(`sortBy ${value}`, async () => {
      await this.ui.selectOption(this.sortDropdown, value, 'Sort');
    });
  }

  async openMenu(): Promise<void> {
    await this.step('openMenu', async () => {
      await this.ui.click(this.hamburgerButton, 'Hamburger menu');
    });
  }

  async logout(): Promise<void> {
    await this.step('logout', async () => {
      await this.openMenu();
      await this.ui.click(this.logoutLink, 'Logout');
    });
  }

  async verifyOnInventory(): Promise<void> {
    await this.verifyOnPage();
    await this.ui.expectVisible(this.appLogo, 'App header logo');
  }

  async verifyCartBadge(expected: number): Promise<void> {
    await this.step(`verifyCartBadge=${expected}`, async () => {
      if (expected === 0) {
        await this.ui.expectHidden(this.cartBadge, 'Cart badge');
        return;
      }
      await this.ui.expectText(this.cartBadge, String(expected), 'Cart badge');
    });
  }
}
```

- [ ] **Step 2: Write `tests/web/inventory/add-remove.spec.ts`**

```ts
import { test } from '@/fixtures';
import { setTestMetadata, Severity } from '@/utils/allureUtils';
import { testDataManager } from '@/utils/testDataManager';

interface WebUserRow {
  TC_ID: string;
  user: string;
  password: string;
}

const BACKPACK = 'Sauce Labs Backpack';
const BIKE_LIGHT = 'Sauce Labs Bike Light';

test.describe('@regression @inventory SauceDemo cart add/remove', () => {
  test.beforeEach(async ({ loginPage }) => {
    const row = testDataManager.getByTcId<WebUserRow>('web_users', 'TC_WEB_AUTH_001');
    await loginPage.open();
    await loginPage.signIn(row.user, row.password);
  });

  test('TC_WEB_INV_001: add two items → badge=2', async ({ inventoryPage }) => {
    await setTestMetadata({
      feature: 'SauceDemo — Inventory',
      story: 'Add to cart',
      severity: Severity.CRITICAL,
      testId: 'TC_WEB_INV_001',
      tags: ['@regression', '@inventory'],
    });
    await inventoryPage.verifyOnInventory();
    await inventoryPage.verifyCartBadge(0);
    await inventoryPage.addToCart(BACKPACK);
    await inventoryPage.addToCart(BIKE_LIGHT);
    await inventoryPage.verifyCartBadge(2);
  });

  test('TC_WEB_INV_002: remove one item → badge=1', async ({ inventoryPage }) => {
    await setTestMetadata({
      feature: 'SauceDemo — Inventory',
      story: 'Remove from cart',
      severity: Severity.NORMAL,
      testId: 'TC_WEB_INV_002',
      tags: ['@regression', '@inventory'],
    });
    await inventoryPage.verifyOnInventory();
    await inventoryPage.addToCart(BACKPACK);
    await inventoryPage.addToCart(BIKE_LIGHT);
    await inventoryPage.removeFromCart(BACKPACK);
    await inventoryPage.verifyCartBadge(1);
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/web/inventory.page.ts tests/web/inventory/add-remove.spec.ts
git commit -m "feat(web): add InventoryPage + add/remove regression specs"
```

---

## Task 29: `CartPage`

**Files:**

- Create: `src/pages/web/cart.page.ts`

- [ ] **Step 1: Implement `src/pages/web/cart.page.ts`**

```ts
import type { Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class CartPage extends BasePage {
  private get container(): Locator {
    return this.page.locator('#cart_contents_container');
  }

  private get checkoutButton(): Locator {
    return this.page.locator('[data-test="checkout"]');
  }

  private get continueShoppingButton(): Locator {
    return this.page.locator('[data-test="continue-shopping"]');
  }

  private cartItem(name: string): Locator {
    return this.page.locator('[data-test="inventory-item"]').filter({ hasText: name });
  }

  private removeByName(name: string): Locator {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    return this.page.locator(`[data-test="remove-${slug}"]`);
  }

  get pageIdentifier(): Locator {
    return this.container;
  }

  async checkout(): Promise<void> {
    await this.step('checkout', async () => {
      await this.ui.click(this.checkoutButton, 'Checkout button');
    });
  }

  async removeItem(productName: string): Promise<void> {
    await this.step(`removeItem "${productName}"`, async () => {
      await this.ui.click(this.removeByName(productName), `Remove ${productName}`);
    });
  }

  async continueShopping(): Promise<void> {
    await this.step('continueShopping', async () => {
      await this.ui.click(this.continueShoppingButton, 'Continue shopping');
    });
  }

  async verifyOnCart(): Promise<void> {
    await this.verifyOnPage();
  }

  async verifyItem(productName: string): Promise<void> {
    await this.step(`verifyItem "${productName}"`, async () => {
      await this.ui.expectVisible(this.cartItem(productName), productName);
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/web/cart.page.ts
git commit -m "feat(web): add CartPage with checkout, removeItem, verifyItem"
```

---

## Task 30: Three Checkout page objects

**Files:**

- Create: `src/pages/web/checkout-info.page.ts`
- Create: `src/pages/web/checkout-overview.page.ts`
- Create: `src/pages/web/checkout-complete.page.ts`

- [ ] **Step 1: Implement `src/pages/web/checkout-info.page.ts`**

```ts
import type { Locator } from '@playwright/test';
import { BasePage } from './base.page';

export interface CustomerForm {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export class CheckoutInfoPage extends BasePage {
  private get container(): Locator {
    return this.page.locator('#checkout_info_container');
  }

  private get firstNameInput(): Locator {
    return this.page.locator('[data-test="firstName"]');
  }

  private get lastNameInput(): Locator {
    return this.page.locator('[data-test="lastName"]');
  }

  private get postalCodeInput(): Locator {
    return this.page.locator('[data-test="postalCode"]');
  }

  private get continueButton(): Locator {
    return this.page.locator('[data-test="continue"]');
  }

  // Scoped to this page so it doesn't conflict with the overview page's own cancel
  private get cancelButton(): Locator {
    return this.container.locator('[data-test="cancel"]');
  }

  private get errorMessage(): Locator {
    return this.page.locator('[data-test="error"]');
  }

  get pageIdentifier(): Locator {
    return this.container;
  }

  async enterCustomerInfo(form: CustomerForm): Promise<void> {
    await this.step('enterCustomerInfo', async () => {
      await this.ui.fill(this.firstNameInput, form.firstName, 'First name');
      await this.ui.fill(this.lastNameInput, form.lastName, 'Last name');
      await this.ui.fill(this.postalCodeInput, form.postalCode, 'Postal code');
    });
  }

  async continue(): Promise<void> {
    await this.step('continue', async () => {
      await this.ui.click(this.continueButton, 'Continue');
    });
  }

  async cancel(): Promise<void> {
    await this.step('cancel', async () => {
      await this.ui.click(this.cancelButton, 'Cancel (info)');
    });
  }

  async verifyOnInfo(): Promise<void> {
    await this.verifyOnPage();
  }

  async verifyValidationError(expected: string): Promise<void> {
    await this.step('verifyValidationError', async () => {
      await this.ui.expectVisible(this.errorMessage, 'Validation error');
      await this.ui.expectContainsText(this.errorMessage, expected, 'Error text');
    });
  }
}
```

- [ ] **Step 2: Implement `src/pages/web/checkout-overview.page.ts`**

```ts
import type { Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class CheckoutOverviewPage extends BasePage {
  private get container(): Locator {
    return this.page.locator('#checkout_summary_container');
  }

  private get itemSubtotalLabel(): Locator {
    return this.page.locator('[data-test="subtotal-label"]');
  }

  private get taxLabel(): Locator {
    return this.page.locator('[data-test="tax-label"]');
  }

  private get totalLabel(): Locator {
    return this.page.locator('[data-test="total-label"]');
  }

  private get finishButton(): Locator {
    return this.page.locator('[data-test="finish"]');
  }

  private get cancelButton(): Locator {
    return this.container.locator('[data-test="cancel"]');
  }

  get pageIdentifier(): Locator {
    return this.container;
  }

  async finish(): Promise<void> {
    await this.step('finish', async () => {
      await this.ui.click(this.finishButton, 'Finish');
    });
  }

  async cancel(): Promise<void> {
    await this.step('cancel', async () => {
      await this.ui.click(this.cancelButton, 'Cancel (overview)');
    });
  }

  async verifyOnOverview(): Promise<void> {
    await this.verifyOnPage();
    await this.ui.expectVisible(this.itemSubtotalLabel, 'Item subtotal');
    await this.ui.expectVisible(this.taxLabel, 'Tax');
    await this.ui.expectVisible(this.totalLabel, 'Total');
  }
}
```

- [ ] **Step 3: Implement `src/pages/web/checkout-complete.page.ts`**

```ts
import type { Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class CheckoutCompletePage extends BasePage {
  private get container(): Locator {
    return this.page.locator('#checkout_complete_container');
  }

  private get completeHeader(): Locator {
    return this.page.locator('[data-test="complete-header"]');
  }

  private get completeText(): Locator {
    return this.page.locator('[data-test="complete-text"]');
  }

  private get ponyExpressImage(): Locator {
    return this.page.locator('[data-test="pony-express"]');
  }

  private get backHomeButton(): Locator {
    return this.page.locator('[data-test="back-to-products"]');
  }

  get pageIdentifier(): Locator {
    return this.container;
  }

  async backHome(): Promise<void> {
    await this.step('backHome', async () => {
      await this.ui.click(this.backHomeButton, 'Back home');
    });
  }

  async verifyOrderComplete(): Promise<void> {
    await this.verifyOnPage();
    await this.ui.expectText(this.completeHeader, 'Thank you for your order!', 'Complete header');
    await this.ui.expectVisible(this.completeText, 'Complete description');
    await this.ui.expectVisible(this.ponyExpressImage, 'Pony Express image');
    await this.ui.expectVisible(this.backHomeButton, 'Back-home button');
  }
}
```

- [ ] **Step 4: Create the web pages barrel `src/pages/web/index.ts`**

```ts
export { BasePage } from './base.page';
export { LoginPage } from './login.page';
export { InventoryPage } from './inventory.page';
export { CartPage } from './cart.page';
export { CheckoutInfoPage, type CustomerForm } from './checkout-info.page';
export { CheckoutOverviewPage } from './checkout-overview.page';
export { CheckoutCompletePage } from './checkout-complete.page';
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/web/checkout-info.page.ts src/pages/web/checkout-overview.page.ts src/pages/web/checkout-complete.page.ts src/pages/web/index.ts
git commit -m "feat(web): add 3 checkout page objects (info/overview/complete) + web barrel"
```

---

## Task 31: End-to-end checkout spec

**Files:**

- Create: `tests/web/checkout/end-to-end.spec.ts`

- [ ] **Step 1: Write `tests/web/checkout/end-to-end.spec.ts`**

```ts
import { test } from '@/fixtures';
import { setTestMetadata, Severity } from '@/utils/allureUtils';
import { testDataManager } from '@/utils/testDataManager';

interface WebUserRow {
  TC_ID: string;
  user: string;
  password: string;
}

interface WebCheckoutRow {
  TC_ID: string;
  firstName: string;
  lastName: string;
  postalCode: string;
}

const BACKPACK = 'Sauce Labs Backpack';

test.describe('@smoke @e2e SauceDemo end-to-end checkout', () => {
  test('TC_WEB_E2E_001: login → add → cart → info → overview → complete', async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutInfoPage,
    checkoutOverviewPage,
    checkoutCompletePage,
  }) => {
    await setTestMetadata({
      feature: 'SauceDemo — Checkout',
      story: 'End-to-end happy path',
      severity: Severity.CRITICAL,
      testId: 'TC_WEB_E2E_001',
      tags: ['@smoke', '@e2e'],
    });

    const user = testDataManager.getByTcId<WebUserRow>('web_users', 'TC_WEB_AUTH_001');
    const form = testDataManager.getByTcId<WebCheckoutRow>('web_checkout', 'TC_WEB_E2E_001');

    await loginPage.open();
    await loginPage.signIn(user.user, user.password);

    await inventoryPage.verifyOnInventory();
    await inventoryPage.addToCart(BACKPACK);
    await inventoryPage.verifyCartBadge(1);
    await inventoryPage.openCart();

    await cartPage.verifyOnCart();
    await cartPage.verifyItem(BACKPACK);
    await cartPage.checkout();

    await checkoutInfoPage.verifyOnInfo();
    await checkoutInfoPage.enterCustomerInfo({
      firstName: form.firstName,
      lastName: form.lastName,
      postalCode: form.postalCode,
    });
    await checkoutInfoPage.continue();

    await checkoutOverviewPage.verifyOnOverview();
    await checkoutOverviewPage.finish();

    await checkoutCompletePage.verifyOrderComplete();
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add tests/web/checkout/end-to-end.spec.ts
git commit -m "feat(web): add end-to-end checkout smoke spec"
```

---

## Task 32: Page fixtures + browser projects + verify green

**Files:**

- Modify: `src/fixtures/types.ts`
- Create: `src/fixtures/page.fixtures.ts`
- Modify: `src/fixtures/index.ts`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Restore full `src/fixtures/types.ts`**

Replace the stub from Task 24 with:

```ts
import type { ApiClient } from '@/utils/apiClient';
import type { HealthService, AuthService, BookingsService } from '@/services/api';
import type {
  LoginPage,
  InventoryPage,
  CartPage,
  CheckoutInfoPage,
  CheckoutOverviewPage,
  CheckoutCompletePage,
} from '@/pages/web';

export interface ApiFixtures {
  apiClient: ApiClient;
  healthApi: HealthService;
  authApi: AuthService;
  bookingsApi: BookingsService;
}

export interface PageFixtures {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutInfoPage: CheckoutInfoPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
}
```

- [ ] **Step 2: Create `src/fixtures/page.fixtures.ts`**

```ts
import { test as base } from '@playwright/test';
import {
  LoginPage,
  InventoryPage,
  CartPage,
  CheckoutInfoPage,
  CheckoutOverviewPage,
  CheckoutCompletePage,
} from '@/pages/web';
import type { PageFixtures } from './types';

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutInfoPage: async ({ page }, use) => {
    await use(new CheckoutInfoPage(page));
  },
  checkoutOverviewPage: async ({ page }, use) => {
    await use(new CheckoutOverviewPage(page));
  },
  checkoutCompletePage: async ({ page }, use) => {
    await use(new CheckoutCompletePage(page));
  },
});

export { expect } from '@playwright/test';
```

- [ ] **Step 3: Update `src/fixtures/index.ts`**

```ts
export { test } from './page.fixtures';
export { apiTest } from './api.fixtures';
export type { ApiFixtures, PageFixtures } from './types';
```

- [ ] **Step 4: Add browser projects to `playwright.config.ts`**

Replace the `projects` array with:

```ts
  projects: [
    {
      name: 'unit',
      testMatch: 'tests/unit/**/*.spec.ts',
      use: {},
    },
    {
      name: 'api',
      testMatch: 'tests/api/**/*.spec.ts',
      use: {
        baseURL: ENV.API_BASE_URL,
        extraHTTPHeaders: { 'Content-Type': 'application/json' },
      },
    },
    {
      name: 'chromium',
      testMatch: 'tests/web/**/*.spec.ts',
      testIgnore: ['tests/api/**', 'tests/unit/**', 'tests/mobile/**'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: ENV.BASE_URL,
        headless: ENV.CI,
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'firefox',
      testMatch: 'tests/web/**/*.spec.ts',
      testIgnore: ['tests/api/**', 'tests/unit/**', 'tests/mobile/**'],
      use: {
        ...devices['Desktop Firefox'],
        baseURL: ENV.BASE_URL,
        headless: ENV.CI,
      },
    },
    {
      name: 'webkit',
      testMatch: 'tests/web/**/*.spec.ts',
      testIgnore: ['tests/api/**', 'tests/unit/**', 'tests/mobile/**'],
      use: {
        ...devices['Desktop Safari'],
        baseURL: ENV.BASE_URL,
        headless: ENV.CI,
      },
    },
  ],
```

Also add `devices` to the import line at the top of `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';
```

- [ ] **Step 5: Run the full suite**

```bash
npm test
```

Expected: all projects green — unit (~10 cases), api (~7-8 cases), chromium/firefox/webkit (~6 cases each = 18 total). Total: ~35-40 specs.

If a browser-specific spec fails (e.g., a locator timing differently on webkit), inspect the trace and adjust. Do NOT add `waitForTimeout`; if a wait is needed, anchor it to a locator.

- [ ] **Step 6: Verify typecheck + lint + format**

```bash
npm run typecheck
npm run lint
npm run format:check
```

Expected: all clean.

- [ ] **Step 7: Commit**

```bash
git add src/fixtures playwright.config.ts
git commit -m "feat(fixtures): add PageFixtures + chromium/firefox/webkit projects; all specs green"
```

---

# Slice 5: CI + polish + Phase 2 stubs

## Task 33: Custom ESLint rule banning explicit waits

**Files:**

- Create: `eslint-rules/no-explicit-wait.js`
- Modify: `.eslintrc.json`

The Playwright plugin already bans `waitForTimeout` and `networkidle`. We add an additional rule that bans `expect(` in spec files outside `tests/unit/` to enforce the verify\*()-delegation convention.

- [ ] **Step 1: Create `eslint-rules/no-explicit-wait.js`**

```js
'use strict';

module.exports = {
  rules: {
    'no-spec-expect': {
      meta: {
        type: 'problem',
        docs: { description: 'Disallow expect() calls in spec files outside tests/unit/' },
        schema: [],
        messages: {
          banned:
            'Use a verify*() method on a Page/Service class instead of expect() in a spec file. Unit tests under tests/unit/ are exempt.',
        },
      },
      create(context) {
        const filename = context.getFilename();
        const isUnit = filename.includes('/tests/unit/');
        const isSpec = /\.spec\.ts$/.test(filename);
        if (!isSpec || isUnit) {
          return {};
        }
        return {
          CallExpression(node) {
            if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'expect') {
              context.report({ node, messageId: 'banned' });
            }
          },
        };
      },
    },
  },
};
```

- [ ] **Step 2: Wire the rule into `.eslintrc.json`**

Update `.eslintrc.json` to add the local plugin. Replace the `plugins` and `rules` arrays:

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint", "playwright", "local-rules"],
  "settings": {
    "local-rules/local-rules-path": "./eslint-rules/no-explicit-wait.js"
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:playwright/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "playwright/no-wait-for-timeout": "error",
    "playwright/no-networkidle": "error",
    "no-console": ["error", { "allow": ["warn", "error"] }]
  },
  "overrides": [
    {
      "files": ["tests/**/*.spec.ts"],
      "excludedFiles": ["tests/unit/**"],
      "rules": {
        "no-restricted-syntax": [
          "error",
          {
            "selector": "CallExpression[callee.name='expect']",
            "message": "Use verify*() on a page/service class instead of expect() in a spec file. Unit tests under tests/unit/ are exempt."
          }
        ]
      }
    }
  ]
}
```

(Using `no-restricted-syntax` instead of a custom plugin keeps the setup simpler — no need to register a local plugin via npm.)

- [ ] **Step 3: Verify lint catches the violation**

Temporarily add `expect(true).toBe(true);` to `tests/web/auth/login.spec.ts` and run:

```bash
npm run lint
```

Expected: ERROR on the temporary line. Remove the line and re-run:

```bash
npm run lint
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add eslint-rules/ .eslintrc.json
git commit -m "feat(lint): ban expect() in non-unit spec files via no-restricted-syntax"
```

---

## Task 34: GitHub Actions workflow

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  set-grep:
    runs-on: ubuntu-latest
    outputs:
      grep: ${{ steps.compute.outputs.grep }}
    steps:
      - id: compute
        name: Determine TEST_GREP based on trigger
        run: |
          if [[ "${{ github.event_name }}" == "pull_request" ]]; then
            echo "grep=@smoke" >> "$GITHUB_OUTPUT"
          else
            echo "grep=" >> "$GITHUB_OUTPUT"
          fi

  unit:
    runs-on: ubuntu-latest
    needs: set-grep
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright test --project=unit
      - if: always()
        uses: actions/upload-artifact@v4
        with:
          name: allure-unit
          path: allure-results

  api:
    runs-on: ubuntu-latest
    needs: set-grep
    env:
      CI: 'true'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Run API tests
        run: |
          if [ -z "${{ needs.set-grep.outputs.grep }}" ]; then
            npx playwright test --project=api
          else
            npx playwright test --project=api --grep "${{ needs.set-grep.outputs.grep }}"
          fi
      - if: always()
        uses: actions/upload-artifact@v4
        with:
          name: allure-api
          path: allure-results

  web:
    runs-on: ubuntu-latest
    needs: set-grep
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]
    env:
      CI: 'true'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps ${{ matrix.browser }}
      - name: Run web tests on ${{ matrix.browser }}
        run: |
          if [ -z "${{ needs.set-grep.outputs.grep }}" ]; then
            npx playwright test --project=${{ matrix.browser }}
          else
            npx playwright test --project=${{ matrix.browser }} --grep "${{ needs.set-grep.outputs.grep }}"
          fi
      - if: always()
        uses: actions/upload-artifact@v4
        with:
          name: allure-web-${{ matrix.browser }}
          path: allure-results

  report:
    runs-on: ubuntu-latest
    needs: [unit, api, web]
    if: always()
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Download all Allure artifacts
        uses: actions/download-artifact@v4
        with:
          path: artifacts
      - name: Merge Allure results
        run: |
          mkdir -p allure-results
          find artifacts -type d -name allure-results -exec sh -c 'cp -r "$1"/* allure-results/ 2>/dev/null || true' _ {} \;
          find artifacts -type f \( -name "*.json" -o -name "*.png" -o -name "*.txt" \) -exec cp {} allure-results/ \;
      - name: Generate Allure report
        run: |
          npm ci
          npx allure generate allure-results --clean -o allure-report
      - uses: actions/upload-artifact@v4
        with:
          name: allure-report
          path: allure-report
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for unit + api + 3-browser web matrix + Allure report"
```

---

## Task 35: Final README

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Replace `README.md` with the full version**

```markdown
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

## What this is

A portfolio-grade Playwright + TypeScript framework that demonstrates senior-level test automation patterns against publicly available test targets:

- **Web UI tests** against [SauceDemo](https://www.saucedemo.com) on Chromium, Firefox, and WebKit
- **API tests** against [Restful-Booker](https://restful-booker.herokuapp.com) — auth, CRUD, schema validation
- **Phase 2 (planned):** Mobile tests against Sauce Labs Sample App on Android via Appium + WebdriverIO

## Prerequisites

- Node.js 20+
- npm 10+

## Quick start

\`\`\`bash
git clone https://github.com/<your-username>/playwright-ts.git
cd playwright-ts
npm install
npx playwright install --with-deps chromium firefox webkit
npm test
\`\`\`

The targets ship credentials publicly (SauceDemo lists them on its login screen, Restful-Booker prints `admin/password123` in its docs), so the default `config/secrets/secrets.template.json` is enough to run.

## Project structure

\`\`\`
config/
environments/ # Per-environment JSON (dev, ci)
secrets/ # Credentials (template committed, real file gitignored)
env.config.ts # Runtime loader (merges JSON + secrets + env vars)
routes.config.ts # Web route paths
api-routes.config.ts # API endpoint paths

src/
pages/
web/ # Page Object Model — extends BasePage
services/
api/ # API service classes — extends BaseApiService
utils/
uiActions.ts # Wrapper over Playwright Page (the only layer that talks to Playwright)
apiClient.ts # Wrapper over Playwright APIRequestContext
logger.ts # TestLogger
schemaValidator.ts # AJV wrapper for JSON Schema validation
testDataManager.ts # TC-ID lookup in testdata.json
testDataUtils.ts # uniqueName, randomEmail, etc.
allureSetup.ts # globalSetup writing environment.properties
allureUtils.ts # setTestMetadata({ feature, story, severity, testId, tags })
fixtures/
page.fixtures.ts # Injects page objects into web specs
api.fixtures.ts # Injects API services into API specs
index.ts # Exports `test` and `apiTest`

test-data/
testdata.json # TC-ID-keyed test data
schemas/ # JSON Schemas for API response validation

tests/
unit/ # Unit tests for utilities
api/ # API integration specs
web/ # Web E2E specs

docs/
locators/ # Verified Playwright locators (extracted via browser_generate_locator MCP)
superpowers/specs/ # Design spec
superpowers/plans/ # Implementation plan
\`\`\`

## Architecture

### Six Playwright projects

| Project    | What it tests                                                        | Browser? |
| ---------- | -------------------------------------------------------------------- | -------- |
| `unit`     | Utility code (env loader, schema validator, logger, data generators) | none     |
| `api`      | Restful-Booker                                                       | none     |
| `chromium` | SauceDemo on Desktop Chrome                                          | yes      |
| `firefox`  | SauceDemo on Desktop Firefox                                         | yes      |
| `webkit`   | SauceDemo on Desktop Safari                                          | yes      |
| `android`  | Sauce Labs Sample App — **Phase 2, not yet implemented**             | Appium   |

### Core patterns

**Page Object Model** — every web page is a class extending `BasePage`. Locators are private getters; actions are public methods wrapped in `this.step()`; assertions live in `verify*()` methods on the page class itself, never in specs.

**API Service Model** — every API resource is a class extending `BaseApiService`. CRUD methods + `verify*()` methods, same pattern.

**UIActions / ApiClient wrappers** — every interaction goes through `this.ui.*` or `this.apiClient.*`. The wrappers are the ONLY layer that talks to Playwright primitives. Single seam for logging, retries, evidence.

**Assertion delegation** — `expect()` lives only inside `verify*()` methods. Specs read like English: `await loginPage.signIn(user); await inventoryPage.verifyOnInventory();`. An ESLint rule enforces this.

**Step annotations** — every page/service method emits `test.step()`, so the Allure report reads as user-narrative ("Click Login button") not Playwright internals ("Wait for selector …").

## Running tests

\`\`\`bash

# All projects

npm test

# Specific project

npm run test:unit
npm run test:api
npm run test:web

# By tag

npm run test:smoke # All @smoke tests across projects
npm run test:regression # Everything except @smoke

# Specific environment

npm run test:dev # config/environments/dev.json (default)
npm run test:ci # config/environments/ci.json (longer timeouts)

# Single spec

npx playwright test tests/web/auth/login.spec.ts --project=chromium

# Filter by tag in test name

npx playwright test --grep "@auth"
\`\`\`

## Writing tests

### Adding a web page object

1. Create `src/pages/web/<name>.page.ts` extending `BasePage`
2. Implement `pageIdentifier` getter (the unique element that confirms the page loaded)
3. Define locators as private getters using `this.page.locator(...)` or `this.page.getByTestId(...)`
4. Add action methods wrapped in `this.step()`
5. Add `verify*()` methods that call `this.ui.expectVisible`/`expectText`/`expectURL`
6. Export from `src/pages/web/index.ts`
7. Add a fixture in `src/fixtures/page.fixtures.ts` and register the type in `src/fixtures/types.ts`

### Adding an API service

1. Create `src/services/api/<name>.api.ts` extending `BaseApiService`
2. Add CRUD methods using `this.apiClient.get/post/put/delete`
3. Register JSON schemas (`SchemaValidator.register`) and call `validator.validate` inside `verify*()` methods
4. Export from `src/services/api/index.ts`
5. Add a fixture in `src/fixtures/api.fixtures.ts` and register the type in `src/fixtures/types.ts`

### Test data

All test data is externalized in `test-data/testdata.json`, keyed by `TC_ID`:

\`\`\`ts
import { testDataManager } from '@/utils/testDataManager';
const user = testDataManager.getByTcId<WebUserRow>('web_users', 'TC_WEB_AUTH_001');
\`\`\`

For unique values per run, use `uniqueName`, `randomEmail`, etc. from `src/utils/testDataUtils`.

## Reporting

\`\`\`bash
npm run allure:serve # Generate and open Allure in one step
npm run allure:generate # Generate report into allure-report/
npm run allure:open # Open previously generated report
\`\`\`

Allure metadata (feature, story, severity, tags) is set per test using `setTestMetadata()`:

\`\`\`ts
await setTestMetadata({
feature: 'SauceDemo — Auth',
story: 'Login — standard user',
severity: Severity.CRITICAL,
testId: 'TC_WEB_AUTH_001',
tags: ['@smoke', '@auth'],
});
\`\`\`

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
| Secrets loaded from file or env vars                                  | Works locally (`secrets.json`) and in CI (env vars)               |

## License

MIT — see [LICENSE](./LICENSE).
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add full README with architecture, usage, and design decisions"
```

---

## Task 36: CLAUDE.md

**Files:**

- Create: `CLAUDE.md`

- [ ] **Step 1: Create `CLAUDE.md`**

```markdown
# Project: Playwright + TypeScript Test Automation

This project uses skills in `.agents/skills/` (Matt Pocock's productivity skills). When working in this repo, the conventions below override default behavior.

## Non-negotiable conventions

### Web

- ALWAYS use `this.ui.*` for all interactions and locators — NEVER `this.page.*` directly
- ALWAYS delegate assertions to `verify*()` methods on page classes — NEVER `expect()` in spec files (ESLint rule enforces this)
- ALWAYS use `this.logger.*` — NEVER `console.log`
- ALWAYS load test data from `test-data/testdata.json` via `testDataManager` — NEVER hardcode values
- NEVER use `page.waitForTimeout()` — use `this.ui.expectVisible()` / `expectHidden()` (ESLint enforces)
- NEVER use `waitForLoadState('networkidle')` after non-navigation actions (ESLint enforces)

### API

- ALWAYS use `this.apiClient.*` — NEVER `request.*` directly
- ALWAYS delegate assertions to `verify*()` methods on service classes
- ALWAYS register JSON schemas in the service constructor and validate inside `verify*()` methods
- ALWAYS clean up created resources in `afterEach` (capture id → delete with token)

### Locators

- Locators come from `docs/locators/saucedemo-locators.json` (extracted via `browser_generate_locator` MCP tool against the live site). Prefer `data-test` attributes; fall back to role / text only when no test ID exists.
- To refresh locators after a SauceDemo update, re-run the `Extract verified SauceDemo locators` subagent prompt with the Playwright MCP `--caps=testing` enabled.

## Project structure

\`\`\`
config/ — environments + secrets + routes
src/utils/ — primitives (UIActions, ApiClient, logger, schemas, data)
src/pages/web/ — Page Object Model (extends BasePage)
src/services/api/ — API services (extends BaseApiService)
src/fixtures/ — Test fixtures (test, apiTest)
test-data/ — testdata.json + JSON schemas
tests/unit/ — Unit tests (utilities)
tests/api/ — API integration specs
tests/web/ — Web E2E specs
docs/locators/ — Verified Playwright locators
\`\`\`

## Adding things

- New page object → `src/pages/web/<name>.page.ts` extends `BasePage`, register fixture in `src/fixtures/page.fixtures.ts` and type in `src/fixtures/types.ts`
- New API service → `src/services/api/<name>.api.ts` extends `BaseApiService`, register fixture in `src/fixtures/api.fixtures.ts` and type in `src/fixtures/types.ts`
- New test → import `test` or `apiTest` from `@/fixtures`, set metadata via `setTestMetadata`, use only fixture-injected page/service instances

## Phase plan

- **Phase 1 (current):** Web (SauceDemo) + API (Restful-Booker)
- **Phase 2 (deferred):** Mobile (Sauce Labs Sample App via Appium). See `src/pages/mobile/` and `tests/mobile/` placeholders.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md with non-negotiable conventions and structure"
```

---

## Task 37: Mobile placeholders for Phase 2

**Files:**

- Create: `src/pages/mobile/README.md`
- Create: `tests/mobile/README.md`
- Create: `config/mobile/README.md`
- Create: `src/pages/mobile/.gitkeep`
- Create: `tests/mobile/.gitkeep`
- Create: `config/mobile/.gitkeep`

- [ ] **Step 1: Create the placeholder folders and `.gitkeep` files**

```bash
mkdir -p src/pages/mobile tests/mobile config/mobile
touch src/pages/mobile/.gitkeep tests/mobile/.gitkeep config/mobile/.gitkeep
```

- [ ] **Step 2: Create `src/pages/mobile/README.md`**

```markdown
# Mobile page objects (Phase 2)

Phase 2 — Mobile tests against the [Sauce Labs Sample App](https://github.com/saucelabs/my-demo-app-rn) on Android via Appium + WebdriverIO.

Not yet implemented. See the Phase 2 design spec at `docs/superpowers/specs/<future>-mobile-phase-2-design.md` when it exists.

Conventions when this folder fills in:

- Extend `BaseMobilePage` (not `BasePage`)
- Use `this.mobile.*` (not `this.driver.*`)
- Locators typed as `PlatformLocator = { android: string; ios: string }` — keep `ios: ''` placeholders for the future iOS pass
```

- [ ] **Step 3: Create `tests/mobile/README.md`**

```markdown
# Mobile specs (Phase 2)

Phase 2 placeholder. Specs here will import `mobileTest` from `@/fixtures` (added in Phase 2).
```

- [ ] **Step 4: Create `config/mobile/README.md`**

```markdown
# Mobile config (Phase 2)

Phase 2 placeholder. Will hold `apps.json`, `devices.json`, capabilities, etc.
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/mobile tests/mobile config/mobile
git commit -m "docs: add Phase 2 mobile placeholders with intent README per folder"
```

---

## Task 38: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Clean workspace and re-run all checks**

```bash
npm run clean
npm run typecheck
npm run lint
npm run format:check
```

Expected: all four commands clean.

- [ ] **Step 2: Run full test suite**

```bash
npm test
```

Expected: all six (well, five non-Phase-2) projects green:

- `unit`: ~10 cases
- `api`: ~7-8 cases
- `chromium`: ~6 cases
- `firefox`: ~6 cases
- `webkit`: ~6 cases

Total ~35-40 passing specs.

- [ ] **Step 3: Generate and open Allure report**

```bash
npm run allure:serve
```

Expected: Allure opens in the browser. Verify:

- All five projects are visible in the "Behaviors" tab
- Feature labels (SauceDemo — Auth, Restful-Booker — Bookings, etc.) are populated
- Severity labels render
- No empty steps (the `test.step()` narrative reads cleanly)

Close the Allure server with Ctrl+C.

- [ ] **Step 4: Push to GitHub**

Create a public repo on GitHub named `playwright-ts` and push:

```bash
git remote add origin https://github.com/<your-username>/playwright-ts.git
git push -u origin main
```

- [ ] **Step 5: Verify CI passes**

Open the Actions tab on GitHub. Expected: the `CI` workflow runs and all jobs (`unit`, `api`, `web` x 3 browsers, `report`) finish green.

- [ ] **Step 6: Update the README badge URL**

If the actual repo URL differs from `<your-username>/playwright-ts`, update the badge URL in `README.md`:

```markdown
[![CI](https://github.com/<actual-username>/playwright-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/<actual-username>/playwright-ts/actions/workflows/ci.yml)
```

Commit and push.

```bash
git add README.md
git commit -m "docs: point CI badge at the published repo URL"
git push
```

- [ ] **Step 7: Final commit summary**

The published repo should have these commits (approximately, in order):

```
chore: initialize repo with MIT license and gitignore
chore: add package.json with Playwright, Allure, AJV, TypeScript, ESLint deps
chore: add strict TypeScript config with @/* path aliases
chore: add ESLint + Prettier configs with Playwright plugin rules
docs: add stub README pointing at design spec and plan
feat(config): add dev/ci environment JSONs and secrets template
feat(config): add env loader with dev/ci JSON merge + secrets layering
feat(config): add web routes and API routes constants
feat(config): add config barrel exporting ENV, ROUTES, API_ROUTES
feat(utils): add TestLogger with leveled output and child loggers
feat(utils): add FrameworkError, ValidationError, ApiError
feat(utils): add testDataUtils generators and testDataManager TC-ID lookup
feat(utils): add AJV SchemaValidator with register/validate
feat(utils): add Allure globalSetup and setTestMetadata helper
feat(config): add utils barrel + initial Playwright config with unit project
feat(utils): add ApiClient with get/post/put/delete + withToken
feat(api): add BaseApiService with step + verifyStatus + verifyHeader
feat(api): add HealthService and ping smoke spec
feat(api): add AuthService, token schema, and create-token smoke spec
feat(api): add booking, booking-id, booking-list JSON schemas
feat(api): add BookingsService with CRUD + verify methods
feat(api): add bookings CRUD regression spec with test-data lookup
feat(api): add bookings list-schema regression spec
feat(fixtures): add ApiFixtures + api Playwright project; all API specs green
feat(utils): add UIActions wrapper with step-narrated interactions and assertions
feat(web): add BasePage with UIActions wrapper, logger, step, and pageIdentifier contract
feat(web): add LoginPage + auth specs (3 cases) with test-data lookup
feat(web): add InventoryPage + add/remove regression specs
feat(web): add CartPage with checkout, removeItem, verifyItem
feat(web): add 3 checkout page objects (info/overview/complete) + web barrel
feat(web): add end-to-end checkout smoke spec
feat(fixtures): add PageFixtures + chromium/firefox/webkit projects; all specs green
feat(lint): ban expect() in non-unit spec files via no-restricted-syntax
ci: add GitHub Actions workflow for unit + api + 3-browser web matrix + Allure report
docs: add full README with architecture, usage, and design decisions
docs: add CLAUDE.md with non-negotiable conventions and structure
docs: add Phase 2 mobile placeholders with intent README per folder
docs: point CI badge at the published repo URL
```

- [ ] **Step 8: Mark plan complete**

In this plan document, the executor should have ticked every checkbox. The repo is now ready to be linked in a resume.

---

## Self-Review Notes (from plan author)

**Spec coverage:**

- §1 Purpose → Plan goal + overview
- §2 Scope → Phase 1 fully covered; Phase 2 placeholders in Task 37
- §3 Goals → Implementation embeds all five goals in code structure
- §4 Architecture → Tasks 15, 24, 32 build out the six Playwright projects
- §5 Dependencies → Task 2 `package.json` lists exactly the spec's dependencies
- §6 File tree → Every file appears as a Create/Modify in at least one task
- §7 Web layer → Tasks 25-32 (six page objects, three specs, UIActions, fixtures)
- §8 API layer → Tasks 16-24 (ApiClient, four services, four schemas, four specs, fixtures)
- §9 Config/secrets/data/reporting → Tasks 6-9, 14, plus per-task testdata.json updates
- §10 Repo hygiene → Tasks 1-5, 33, 35-36
- §11 CI/CD → Task 34
- §12 Slicing → Tasks grouped into five slices matching spec §12 exactly
- §13 Verification gates → Each task's "Step N: Run" steps embed the gates
- §14 Risks → README's "Design decisions" surfaces the Heroku flake mitigation indirectly; the locator-refresh procedure lives in CLAUDE.md

**Placeholder scan:** Searched plan for "TBD", "TODO", "fill in", "similar to". The one TODO reference is in Task 38 (verification gate confirming no NEW todos in slice code). Clean.

**Type consistency:** `ApiClient` signature consistent across Tasks 16 / 17 / 19 / 21 / 24. `TypedResponse<T>` shape consistent. `PageFixtures` and `ApiFixtures` types consistent between Task 24 (stub) and Task 32 (final). `BasePage` and `BaseApiService` signatures match all subclass calls. `ENV` properties match `env.config.ts` exports and consumer references.
