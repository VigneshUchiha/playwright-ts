# Playwright + TypeScript Minimal Clone — Design Spec

**Author:** Sandesha Thandra
**Date:** 2026-05-24
**Status:** Approved for implementation planning

## 1. Purpose

Build a public, resume-grade Playwright + TypeScript test automation framework that demonstrates senior-level architectural patterns (Page Object Model, custom action wrappers, fixture-injected page/service objects, multi-environment config, Allure tagging, JSON Schema validation) against widely-recognized public test targets.

The framework is being written **from scratch** as a clean-origin codebase (Approach A — no copy-paste from the source company framework at `<source-company-framework>`). Architectural patterns themselves are industry standard and not company IP; the specific code is.

## 2. Scope

### Phase 1 (this spec)

- **Web UI tests** against [SauceDemo](https://www.saucedemo.com) (Swag Labs)
- **API tests** against [Restful-Booker](https://restful-booker.herokuapp.com)
- **CI/CD** for web + API only, via GitHub Actions

### Phase 2 (deferred to a separate spec)

- **Mobile tests** against the open-source [Sauce Labs Sample App](https://github.com/saucelabs/my-demo-app-rn) on Android via Appium + WebdriverIO
- iOS placeholders (`PlatformLocator` pattern with empty `ios: ''` slots)
- The Phase 1 file tree includes empty mobile folders with `.gitkeep` and a stub README pointing at the Phase 2 spec

### Out of scope (explicitly excluded)

- `sharp-healer` (LLM-driven self-healing) — user excluded
- ReportPortal integration — user excluded
- `healx-playwright` (private package) — never public
- AI Explorer/Coder/Healer agent pipelines from the source
- Storage-state authentication caching — user excluded; each spec logs in fresh
- Cogmento CRM and FreeCRM page objects, secrets, or any company-specific branding
- HTML, JSON, and GitHub-summary reporters (Allure is the canonical report)

## 3. Goals and non-goals

### Goals

1. **Clean-origin codebase** — every line is original, no lifted IP
2. **Architectural showcase** — POM, action-wrapper layer, fixtures, multi-env, Allure tagging, schema validation
3. **Verified locators** — sourced via `browser_generate_locator` MCP tool against the live site, not guessed
4. **Runtime efficiency** — parallel workers, API project skips browser launch, conditional artifacts, no `waitForTimeout`
5. **Public portfolio quality** — MIT license, thorough README, working CI, green out of the box

### Non-goals

- Building a generic Playwright tutorial (this is a _framework_, not a guide)
- Covering every SauceDemo / Restful-Booker endpoint exhaustively — 2-3 specs per surface, picked for architectural variety
- Cross-platform mobile in Phase 1

## 4. High-level architecture

### Layering

```
config ── runtime values (URLs, timeouts, secrets)
   │
utils ──── primitives (logger, action wrappers, schema validator, data manager)
   │
fixtures ─ Playwright test fixtures inject pre-built page/service objects
   │
pages / services ── domain layer (POM for web, service classes for API)
   │
specs ──── tests assert behavior; never reach down past `verify*()` methods
```

### Six Playwright projects (one repo)

| Project    | Test glob                   | Browser?        | Purpose                                                                                                          |
| ---------- | --------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------- |
| `unit`     | `tests/unit/**/*.spec.ts`   | none            | Pure-node unit tests for utilities (env loader, schema validator, data generators, logger). No HTTP, no browser. |
| `api`      | `tests/api/**/*.spec.ts`    | none            | Restful-Booker CRUD + schema validation. Skips browser launch → fastest of the integration projects.             |
| `chromium` | `tests/web/**/*.spec.ts`    | Desktop Chrome  | SauceDemo                                                                                                        |
| `firefox`  | `tests/web/**/*.spec.ts`    | Desktop Firefox | SauceDemo                                                                                                        |
| `webkit`   | `tests/web/**/*.spec.ts`    | Desktop Safari  | SauceDemo                                                                                                        |
| `android`  | `tests/mobile/**/*.spec.ts` | Appium          | **Phase 2** — declared in config so the matrix shape is visible, but no specs run in Phase 1                     |

`testIgnore` on each browser project excludes `tests/api/**`, `tests/unit/**`, and `tests/mobile/**` so each project sees only its own surface. The `unit` and `api` projects don't declare a browser context — `unit` is bare, `api` only declares `extraHTTPHeaders` and `baseURL`.

### Module boundaries (the tight ones)

- **`UIActions` and `ApiClient`** are the only modules that talk to Playwright primitives. Page objects and services go through them. Single seam for logging, retries, evidence later.
- **`expect()` lives only inside `verify*()` methods** on page/service classes. Those `verify*()` methods delegate to the wrapper's assertion helpers (`this.ui.expectVisible`, `this.ui.expectText`, `this.apiClient.expectStatus`); the wrapper is where Playwright's `expect()` is actually called. Specs themselves contain zero `expect()` calls. ESLint rule (custom) enforces this in `tests/**/*.spec.ts` (excluding `tests/unit/`, where unit tests can use `expect()` directly).
- **`page.waitForTimeout()` and `waitForLoadState('networkidle')` are banned** — locator-based `expectVisible` / `expectHidden` only. Custom ESLint rule.
- **Locators are private getters returning `Locator` objects.** Concrete locator strings come from `docs/locators/saucedemo-locators.json` (verified via `browser_generate_locator`).

### Efficiency anchors

1. `fullyParallel: true`; workers = `process.env.CI ? 2 : 4`
2. `api` project has no browser context, no viewport, no trace/screenshot defaults — minimal cold start
3. Conditional Allure attachments: `trace: 'retain-on-failure'`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'` — green runs produce zero artifacts
4. No storage-state caching (user excluded) — each spec authenticates fresh; offset by `fullyParallel + workers=4` locally
5. No `waitForTimeout` anywhere — every wait is locator-anchored

## 5. Dependencies (public npm only)

```
@playwright/test
allure-playwright
allure-commandline
ajv
ajv-formats
typescript
@types/node
eslint
@typescript-eslint/parser
@typescript-eslint/eslint-plugin
eslint-plugin-playwright
prettier
```

**No** `.tgz` files. **No** private GitHub URLs. **No** WebdriverIO/Appium deps in Phase 1 — those land in Phase 2.

## 6. File tree (Phase 1)

```
playwright-ts/
├─ .agents/skills/                            # already populated (Matt Pocock skills)
├─ .github/
│  └─ workflows/
│     └─ ci.yml
├─ config/
│  ├─ environments/
│  │  ├─ dev.json
│  │  └─ ci.json
│  ├─ secrets/
│  │  ├─ secrets.template.json                # committed
│  │  └─ secrets.json                         # gitignored
│  ├─ env.config.ts
│  ├─ routes.config.ts
│  ├─ api-routes.config.ts
│  ├─ mobile/                                 # Phase 2 placeholder
│  │  └─ .gitkeep
│  └─ index.ts
├─ docs/
│  ├─ locators/
│  │  └─ saucedemo-locators.json              # already generated by subagent
│  └─ superpowers/specs/
│     └─ 2026-05-24-playwright-ts-minimal-clone-design.md
├─ eslint-rules/
│  └─ no-explicit-wait.js
├─ src/
│  ├─ pages/
│  │  ├─ web/
│  │  │  ├─ base.page.ts
│  │  │  ├─ login.page.ts
│  │  │  ├─ inventory.page.ts
│  │  │  ├─ cart.page.ts
│  │  │  ├─ checkout-info.page.ts
│  │  │  ├─ checkout-overview.page.ts
│  │  │  ├─ checkout-complete.page.ts
│  │  │  └─ index.ts
│  │  └─ mobile/                              # Phase 2 placeholder
│  │     └─ .gitkeep
│  ├─ services/
│  │  └─ api/
│  │     ├─ base.api.ts
│  │     ├─ auth.api.ts
│  │     ├─ bookings.api.ts
│  │     ├─ health.api.ts
│  │     └─ index.ts
│  ├─ fixtures/
│  │  ├─ page.fixtures.ts
│  │  ├─ api.fixtures.ts
│  │  ├─ types.ts
│  │  └─ index.ts
│  ├─ utils/
│  │  ├─ uiActions.ts
│  │  ├─ apiClient.ts
│  │  ├─ logger.ts
│  │  ├─ errors.ts
│  │  ├─ testDataManager.ts
│  │  ├─ testDataUtils.ts
│  │  ├─ schemaValidator.ts
│  │  ├─ allureSetup.ts
│  │  ├─ allureUtils.ts
│  │  └─ index.ts
│  └─ index.ts
├─ test-data/
│  ├─ testdata.json
│  └─ schemas/
│     ├─ booking.schema.json
│     ├─ booking-id.schema.json
│     ├─ booking-list.schema.json
│     └─ token.schema.json
├─ tests/
│  ├─ unit/
│  │  ├─ env-loader.spec.ts
│  │  ├─ schema-validator.spec.ts
│  │  ├─ test-data-utils.spec.ts
│  │  └─ logger.spec.ts
│  ├─ api/
│  │  ├─ health/
│  │  │  └─ ping.spec.ts
│  │  ├─ auth/
│  │  │  └─ create-token.spec.ts
│  │  └─ bookings/
│  │     ├─ crud.spec.ts
│  │     └─ schema.spec.ts
│  ├─ web/
│  │  ├─ auth/
│  │  │  └─ login.spec.ts
│  │  ├─ inventory/
│  │  │  └─ add-remove.spec.ts
│  │  └─ checkout/
│  │     └─ end-to-end.spec.ts
│  └─ mobile/                                 # Phase 2 placeholder
│     └─ .gitkeep
├─ .eslintignore
├─ .eslintrc.json
├─ .gitignore
├─ .prettierignore
├─ .prettierrc
├─ CLAUDE.md
├─ LICENSE                                    # MIT
├─ package.json
├─ playwright.config.ts
├─ README.md
└─ tsconfig.json
```

## 7. Web layer (SauceDemo)

### Page objects — `src/pages/web/`

| File                        | Purpose                                                                                                                                                                               | Key public methods                                                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base.page.ts`              | Abstract base; holds `page: Page`, `ui: UIActions`, `logger: TestLogger`. Forces `pageIdentifier: Locator` (the unique element that confirms the page loaded), `navigate()`, `step()` | `navigate()`, `step()`, `pageIdentifier` (abstract getter)                                                                                                       |
| `login.page.ts`             | SauceDemo `/` login form                                                                                                                                                              | `signIn(username, password)`, `verifyLoginError(expected)`, `verifyOnLogin()`                                                                                    |
| `inventory.page.ts`         | `/inventory.html` product list                                                                                                                                                        | `addToCartByName(name)`, `removeFromCartByName(name)`, `openCart()`, `sortBy(option)`, `openMenu()`, `logout()`, `verifyOnInventory()`, `verifyCartBadge(count)` |
| `cart.page.ts`              | `/cart.html`                                                                                                                                                                          | `checkout()`, `removeItem(name)`, `continueShopping()`, `verifyOnCart()`, `verifyItems(names)`                                                                   |
| `checkout-info.page.ts`     | `/checkout-step-one.html` — customer info form                                                                                                                                        | `enterCustomerInfo({first,last,zip})`, `continue()`, `cancel()`, `verifyOnInfo()`, `verifyValidationError(expected)`                                             |
| `checkout-overview.page.ts` | `/checkout-step-two.html` — order review                                                                                                                                              | `finish()`, `cancel()`, `verifyOnOverview()`, `verifyTotals({subtotal,tax,total})`                                                                               |
| `checkout-complete.page.ts` | `/checkout-complete.html` — confirmation                                                                                                                                              | `backHome()`, `verifyOrderComplete()`                                                                                                                            |

Three checkout page objects instead of one keeps each class single-purpose and lets future checkout-related features (e.g., shipping options on step-two) land in the right file without bloating a multi-state object.

### Locators

All locators are sourced verbatim from `docs/locators/saucedemo-locators.json` (verified via `browser_generate_locator` against the live site). Locator strings are private getters on each page object.

**Five known gotchas (from locator-extraction notes — must be applied):**

1. **Swag Labs logo** — `getByText('Swag Labs')` matches multiple places. Scope by parent in page objects: `this.page.locator('.login_logo, .app_logo').first()`.
2. **Cart badge vs cart link** — `[data-test="shopping-cart-link"]` wraps both. Use `.shopping_cart_badge` for the count itself, `[data-test="shopping-cart-link"]` for the clickable area.
3. **Backpack product link** — `[data-test="item-4-title-link"]` uses internal product id 4. Stable for the demo. Alternative `getByRole('link', { name: 'Sauce Labs Backpack' })` matches _two_ links per card (image + title) and would need `.first()`.
4. **`cancel` button duplicate** — `[data-test="cancel"]` appears on both checkout step-one and step-two. Resolved by the page-object split: `checkout-info.page.ts` and `checkout-overview.page.ts` each own their own `cancel` getter, so there's no shared global.
5. **`remove-sauce-labs-backpack` reused** — same locator works on both inventory and cart. Different page objects each own their own getter for it; no shared global.

### Specs — `tests/web/`

| Spec                           | TC IDs                 | Tags                     | Verifies                                                                                                   |
| ------------------------------ | ---------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `auth/login.spec.ts`           | `TC_WEB_AUTH_001..003` | `@smoke @auth`           | (1) standard_user → inventory loads, (2) locked_out_user → error banner, (3) wrong password → error banner |
| `inventory/add-remove.spec.ts` | `TC_WEB_INV_001..002`  | `@regression @inventory` | (1) Add Backpack + Bike Light → badge=2, (2) Remove one → badge=1, button text returns to "Add to cart"    |
| `checkout/end-to-end.spec.ts`  | `TC_WEB_E2E_001`       | `@smoke @e2e`            | login → add Backpack → cart → checkout step-one → step-two → finish → "Thank you for your order!"          |

### Fixture — `src/fixtures/page.fixtures.ts`

```ts
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
```

Specs consume them: `test('login', async ({ loginPage, inventoryPage }) => { ... })`. No `new LoginPage()` in any spec file.

### `UIActions` wrapper — `src/utils/uiActions.ts`

Public surface (only what the page objects above call):

```ts
class UIActions {
  constructor(private page: Page, private logger: TestLogger);

  // Interactions (each wraps the equivalent Playwright call in test.step())
  click(locator: Locator, label?: string): Promise<void>;
  fill(locator: Locator, value: string, label?: string): Promise<void>;
  selectOption(locator: Locator, value: string, label?: string): Promise<void>;
  hover(locator: Locator, label?: string): Promise<void>;

  // Assertions (all expect() calls in the project live here or in page-class verify*() methods that delegate here)
  expectVisible(locator: Locator, label?: string): Promise<void>;
  expectHidden(locator: Locator, label?: string): Promise<void>;
  expectText(locator: Locator, expected: string | RegExp): Promise<void>;
  expectURL(pattern: string | RegExp): Promise<void>;
  expectCount(locator: Locator, expected: number): Promise<void>;

  // Locator builders (test IDs first; role and text only when test ID missing)
  getByTestId(id: string): Locator;
  getByRole(role: AriaRole, options?: { name?: string | RegExp }): Locator;
  getByText(text: string | RegExp): Locator;
}
```

Every method emits a `test.step()` with the label so the Allure tree reads as user-narrative ("Click Login button"), not Playwright internals.

## 8. API layer (Restful-Booker)

### Endpoints covered

| Endpoint       | Method | Used by                                                           |
| -------------- | ------ | ----------------------------------------------------------------- |
| `/ping`        | GET    | `HealthService.ping()`                                            |
| `/auth`        | POST   | `AuthService.createToken({username, password})` → returns `token` |
| `/booking`     | GET    | `BookingsService.listBookings(filters?)`                          |
| `/booking/:id` | GET    | `BookingsService.getBooking(id)`                                  |
| `/booking`     | POST   | `BookingsService.createBooking(payload)`                          |
| `/booking/:id` | PUT    | `BookingsService.updateBooking(id, payload, token)`               |
| `/booking/:id` | DELETE | `BookingsService.deleteBooking(id, token)`                        |

### Services — `src/services/api/`

| File              | Purpose                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base.api.ts`     | Abstract base. Holds `apiClient: ApiClient`, `logger`, `step()`. Provides `verifyStatus(response, expected)`, `verifyHeaders(response, expected)` |
| `health.api.ts`   | `ping()`, `verifyPingOk(response)`                                                                                                                |
| `auth.api.ts`     | `createToken(creds)`, `verifyTokenIssued(response)`                                                                                               |
| `bookings.api.ts` | CRUD methods + `verifyBookingMatches(actual, expected)`, `verifyBookingId(response)`, `verifyValidationError(response, msg)`                      |

### `ApiClient` wrapper — `src/utils/apiClient.ts`

```ts
class ApiClient {
  constructor(request: APIRequestContext, baseURL: string, defaultHeaders?: Record<string, string>);

  get<T>(path: string, opts?: ReqOpts): Promise<TypedResponse<T>>;
  post<T>(path: string, body: unknown, opts?: ReqOpts): Promise<TypedResponse<T>>;
  put<T>(path: string, body: unknown, opts?: ReqOpts): Promise<TypedResponse<T>>;
  delete(path: string, opts?: ReqOpts): Promise<TypedResponse<void>>;

  withToken(token: string): ApiClient; // returns a new client with Cookie: token=<value>
}
```

Restful-Booker accepts the token as `Cookie: token=<value>` (their docs' default). `withToken()` clones the client with that header preset — authenticated services don't carry token logic in their methods.

### Schema validation — `src/utils/schemaValidator.ts`

AJV-based. One schema per response shape, stored in `test-data/schemas/`:

```
booking.schema.json        # single booking object
booking-id.schema.json     # POST /booking response wrapper { bookingid, booking }
booking-list.schema.json   # GET /booking → array of {bookingid:number}
token.schema.json          # POST /auth → { token: string }
```

Services call `this.validator.validate(schemaName, response.body)` inside their `verify*()` methods. Failures throw with a readable diff.

### Fixture — `src/fixtures/api.fixtures.ts`

```ts
export const apiTest = base.extend<ApiFixtures>({
  apiClient: async ({ request }, use) => {
    await use(new ApiClient(request, ENV.API_BASE_URL));
  },
  authApi: async ({ apiClient }, use) => {
    await use(new AuthService(apiClient));
  },
  healthApi: async ({ apiClient }, use) => {
    await use(new HealthService(apiClient));
  },
  bookingsApi: async ({ apiClient }, use) => {
    await use(new BookingsService(apiClient));
  },
});
```

### Specs — `tests/api/`

| Spec                        | TC IDs                   | Tags                    | Verifies                                                                                             |
| --------------------------- | ------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `health/ping.spec.ts`       | `TC_API_HEALTH_001`      | `@smoke @health`        | `GET /ping` returns 201 "Created"                                                                    |
| `auth/create-token.spec.ts` | `TC_API_AUTH_001..002`   | `@smoke @auth`          | (1) Valid creds → token issued + schema validates, (2) Invalid creds → `{reason: "Bad credentials"}` |
| `bookings/crud.spec.ts`     | `TC_API_BOOK_001..004`   | `@regression @bookings` | Create → list contains id → get matches payload → update → delete (204) → get returns 404            |
| `bookings/schema.spec.ts`   | `TC_API_BOOK_SCHEMA_001` | `@regression @schema`   | `GET /booking` list — every item matches `booking-list.schema.json`                                  |

Cleanup: each spec that creates a booking captures `bookingid` and deletes it in `afterEach` with the token.

## 9. Config, secrets, test data, reporting

### Config — `config/`

`config/environments/dev.json`:

```json
{
  "baseURL": "https://www.saucedemo.com",
  "apiBaseURL": "https://restful-booker.herokuapp.com",
  "timeouts": { "default": 10000, "action": 8000, "navigation": 15000 }
}
```

`config/environments/ci.json` (shallow-merged on top of `dev.json` when `ACTIVE_ENV=ci`):

```json
{
  "timeouts": { "action": 15000, "navigation": 30000 }
}
```

`env.config.ts` reads `--env=<name>` (default `dev`), merges `environments/<name>.json` over the dev baseline, layers `secrets.json` (or template), and exposes `ENV.BASE_URL`, `ENV.API_BASE_URL`, `ENV.STANDARD_USER`, `ENV.PASSWORD`, `ENV.DEFAULT_TIMEOUT`, `ENV.ACTION_TIMEOUT`, `ENV.NAVIGATION_TIMEOUT`, `ENV.CI` (from `process.env.CI`).

`routes.config.ts` — UI paths: `{ LOGIN: '/', INVENTORY: '/inventory.html', CART: '/cart.html', CHECKOUT_ONE: '/checkout-step-one.html', CHECKOUT_TWO: '/checkout-step-two.html', CHECKOUT_COMPLETE: '/checkout-complete.html' }`.

`api-routes.config.ts` — API paths: `{ AUTH: '/auth', PING: '/ping', BOOKINGS: '/booking', BOOKING_BY_ID: (id) => `/booking/${id}` }`.

### Secrets — `config/secrets/`

`secrets.template.json` (committed):

```json
{
  "saucedemo": { "standardUser": "standard_user", "password": "secret_sauce" },
  "restfulBooker": { "username": "admin", "password": "password123" }
}
```

Loader precedence: `process.env.STANDARD_USER` etc. > `secrets.json` (gitignored) > `secrets.template.json`. README documents that the template values are real because both targets publish them; for production targets users should copy to `secrets.json` and gitignore.

### Test data — `test-data/`

`testdata.json` keyed by TC_ID, grouped by entity:

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
      "expectedError": "Sorry, this user has been locked out."
    },
    {
      "TC_ID": "TC_WEB_AUTH_003",
      "user": "standard_user",
      "password": "wrong_password",
      "expectedError": "Username and password do not match any user in this service"
    }
  ],
  "web_checkout": [
    { "TC_ID": "TC_WEB_E2E_001", "firstName": "John", "lastName": "Doe", "postalCode": "12345" }
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

`testDataUtils.ts` — generators for uniqueness: `uniqueName(base)`, `randomEmail()`, `randomCustomerInfo()`, `isoDate(offsetDays)`.

`testDataManager.ts` — `getByTcId(entity, tcId)` lookup helper (throws if not found) plus a typed accessor per entity.

### Reporting

Reporters in `playwright.config.ts`:

```ts
reporter: [
  ['list'], // console
  ['allure-playwright', { detail: false, suiteTitle: true }], // canonical HTML
];
```

`src/utils/allureSetup.ts` is the `globalSetup` — writes `allure-results/environment.properties`, `executor.json`, `categories.json` (failure-bucket rules).

`src/utils/allureUtils.ts` — `setTestMetadata({ feature, story, severity, testId, tags })` called at the top of every spec.

`detail: false` hides Playwright's internal `Wait for selector …` steps in the Allure tree, so it reads as user-narrative only.

## 10. Repo hygiene

| File             | Contents                                                                                                                                                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.gitignore`     | `node_modules/`, `allure-results/`, `allure-report/`, `test-results/`, `playwright-report/`, `config/secrets/secrets.json`, `.env`, `*.log`, `.DS_Store`                                                                                                   |
| `.eslintrc.json` | `@typescript-eslint`, `eslint-plugin-playwright` recommended sets. Local plugin loads `eslint-rules/no-explicit-wait.js` which bans `page.waitForTimeout`, `waitForLoadState('networkidle')`, and `expect(` in `tests/**/*.spec.ts` (except `tests/unit/`) |
| `.prettierrc`    | `{ semi: true, singleQuote: true, trailingComma: 'all', printWidth: 100, tabWidth: 2 }`                                                                                                                                                                    |
| `tsconfig.json`  | `strict: true`, `target: ES2022`, `module: commonjs`, `esModuleInterop: true`, `paths: { '@/*': ['src/*'], '@config/*': ['config/*'] }`                                                                                                                    |
| `LICENSE`        | MIT                                                                                                                                                                                                                                                        |
| `README.md`      | Sections: What is this → Prerequisites → Quick start → Project structure → Architecture → Running tests → Writing tests (add a page object, add an API service) → Reporting → Design decisions. ~250 lines.                                                |
| `CLAUDE.md`      | Non-negotiable conventions: always use `this.ui.*`, never `this.page.*`; assertions in `verify*()` only; `this.logger.*` only; locators from `docs/locators/`; no `waitForTimeout`; no `networkidle`.                                                      |

## 11. CI/CD — `.github/workflows/ci.yml`

Three jobs:

**`api`** — `ubuntu-latest`, single job: checkout → setup-node@v4 (20, npm cache) → `npm ci` → `npx playwright test --project=api` → upload `allure-results/` as artifact named `allure-api`.

**`web`** — `ubuntu-latest`, matrix `{ browser: [chromium, firefox, webkit] }`: checkout → setup-node@v4 → `npm ci` → `npx playwright install --with-deps ${{ matrix.browser }}` → `npx playwright test --project=${{ matrix.browser }}` → upload `allure-results/` as artifact `allure-web-${{ matrix.browser }}`.

**`report`** — depends on `api` and `web`, runs `if: always()`: downloads all four `allure-*` artifacts, merges into one `allure-results/`, runs `npx allure generate allure-results --clean -o allure-report`, uploads `allure-report` as a single artifact.

Triggers and scope (controlled by a single env var `TEST_GREP` set at the job level):

| Trigger             | `TEST_GREP` value            | Effective command                                                         |
| ------------------- | ---------------------------- | ------------------------------------------------------------------------- |
| `pull_request`      | `@smoke`                     | `npx playwright test --project=<p> --grep "$TEST_GREP"` — fast (~1-2 min) |
| `push` to `main`    | _(unset)_                    | `npx playwright test --project=<p>` — full suite                          |
| `workflow_dispatch` | input-driven (default empty) | manual on-demand                                                          |

A `set-grep` step at the start of each job sets `TEST_GREP` based on `github.event_name`. Each test step references `${{ env.TEST_GREP }}` and falls through to the full suite when empty. This keeps the grep logic in one place rather than duplicated in each step's `run:` block.

## 12. TDD implementation slicing

Five independently shippable slices. Each ends with a green test command for everything built so far. Each lands as a single commit (small enough to review cleanly).

### Slice 1 — Bootstrap (~30 min)

- `package.json` (deps from §5), `tsconfig.json` (strict), `.gitignore`, `.eslintrc.json`, `.prettierrc`, `.eslintignore`, `.prettierignore`, `LICENSE` (MIT), stub `README.md` with title + "WIP"
- **Exit:** `npm install` clean; `npx tsc --noEmit` clean; `npx playwright test` returns "no tests found" without error

### Slice 2 — Config + utility primitives (~1-2 hrs)

- `config/environments/{dev,ci}.json`, `config/secrets/secrets.template.json`, `config/env.config.ts`, `config/routes.config.ts`, `config/api-routes.config.ts`, `config/index.ts`
- `src/utils/logger.ts`, `errors.ts`, `testDataManager.ts`, `testDataUtils.ts`, `schemaValidator.ts`, `allureSetup.ts`, `allureUtils.ts`, `index.ts`
- Each utility ships with a `tests/unit/*.spec.ts` (env loader merges overrides; schema validator rejects bad payload; `uniqueName` is unique across 1000 calls; logger respects levels)
- `playwright.config.ts` gains the `unit` project (no browser, no `baseURL`, `testMatch: 'tests/unit/**/*.spec.ts'`)
- **Exit:** `npx playwright test --project=unit` is green (8-12 unit tests)

### Slice 3 — API layer end-to-end (~2-3 hrs)

- `src/utils/apiClient.ts` driven by failing fixture-level test first
- `src/services/api/base.api.ts`, `health.api.ts`, `auth.api.ts`, `bookings.api.ts`, `index.ts` — each `verify*()` method TDD'd
- `test-data/schemas/{booking, booking-id, booking-list, token}.schema.json`
- `src/fixtures/api.fixtures.ts`, `src/fixtures/index.ts` (partial)
- `tests/api/health/ping.spec.ts`, `tests/api/auth/create-token.spec.ts`, `tests/api/bookings/crud.spec.ts`, `tests/api/bookings/schema.spec.ts`
- `playwright.config.ts` gains the `api` project
- **Exit:** `npx playwright test --project=api` is green; ~7-8 API specs

### Slice 4 — Web layer end-to-end (~3-4 hrs)

- `src/utils/uiActions.ts` (built bottom-up via failing test cases on simple locator interactions)
- `src/pages/web/base.page.ts`, `login.page.ts`, `inventory.page.ts`, `cart.page.ts`, `checkout-info.page.ts`, `checkout-overview.page.ts`, `checkout-complete.page.ts`, `index.ts`
  - **Locators sourced verbatim from `docs/locators/saucedemo-locators.json`**
  - **Five gotchas applied:** scoped logo, badge separate from link, cancel scoped per page (each checkout page owns its own `cancel` getter), backpack `item-4-title-link`, separate getters on inventory vs cart for `remove-sauce-labs-backpack`
- `src/fixtures/page.fixtures.ts`, `src/fixtures/index.ts` (complete)
- `tests/web/auth/login.spec.ts`, `tests/web/inventory/add-remove.spec.ts`, `tests/web/checkout/end-to-end.spec.ts`
- `playwright.config.ts` gains `chromium`, `firefox`, `webkit` projects
- **Exit:** `npx playwright test` runs unit + api + 3 browser projects all green

### Slice 5 — CI + polish + Phase 2 stubs (~1-2 hrs)

- `.github/workflows/ci.yml` (the three jobs from §11)
- `eslint-rules/no-explicit-wait.js` (custom rule) wired into `.eslintrc.json`
- Final `README.md` (~250 lines, sections per §10)
- Final `CLAUDE.md` capturing the conventions
- **Phase 2 stubs:** `src/pages/mobile/.gitkeep`, `tests/mobile/.gitkeep`, `config/mobile/.gitkeep` with a per-folder `README.md` saying "Phase 2 — see `docs/superpowers/specs/<future>-mobile-phase-2-design.md`"
- One local smoke pass; push to GitHub; verify green PR build
- **Exit:** Public repo URL with a green CI badge in README

**Total estimate:** 8-12 hours of focused work across 5 commits/PRs.

## 13. Verification gates

Each slice must satisfy these before being marked done (per the `verification-before-completion` superpowers skill):

1. The slice's stated exit command is run and produces green output (paste evidence in the commit message)
2. `npx tsc --noEmit` is clean (no TS errors)
3. `npm run lint` is clean (no ESLint errors, including the custom `no-explicit-wait` rule)
4. `npm run format:check` is clean
5. No new TODO/FIXME comments left in the slice
6. New files have no `console.log` (logger only)
7. New specs have no `expect()` outside `verify*()` methods (custom ESLint rule catches this)

## 14. Risks and mitigations

| Risk                                                                                                        | Mitigation                                                                                                                                                |
| ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Restful-Booker's Heroku instance occasionally times out (cold start)                                        | API client retries 5xx once with 1s back-off; documented in README                                                                                        |
| SauceDemo locators drift if SauceDemo updates the site                                                      | Locators centralized in `docs/locators/saucedemo-locators.json`. Re-run the locator-extraction subagent (documented in CLAUDE.md) to refresh in one pass. |
| Allure dependency drift between `allure-playwright` and `allure-commandline` major versions                 | Pin both to a matching major in `package.json`; CI verifies report generation each run                                                                    |
| The exclusion list (no sharp-healer, no ReportPortal, no storage-state) gets quietly reintroduced over time | CLAUDE.md states the exclusions and why; the `using-superpowers` skill is the primary review safeguard going forward                                      |
| New contributor adds `expect()` in a spec or `waitForTimeout` somewhere                                     | Custom ESLint rule in Slice 5 blocks these at lint time, before CI                                                                                        |

## 15. Open questions

None. All major decisions resolved during brainstorming (ambition, targets, mobile-scope, CI-scope, license, env count, slicing).
