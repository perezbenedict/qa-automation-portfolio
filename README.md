# QA Automation Portfolio

A Playwright Test suite written in plain JavaScript (no TypeScript) that exercises three public targets:

- **SauceDemo** (`https://www.saucedemo.com`) — storefront UI workflows
- **DummyJSON** (`https://dummyjson.com`) — REST API behavior
- **playwright.dev** — documentation smoke and quality checks

All three are external public services. There is no application-under-test in this repository; the tests hit the live targets over the network.

## Test inventory

### UI — SauceDemo (`tests/ui/`)

| File | Covers |
| --- | --- |
| `authentication.spec.js` | Valid login, unknown user, wrong password, locked-out user, required-field errors |
| `catalog.spec.js` | Name and price sorting in both directions, product detail navigation |
| `cart.spec.js` | Empty cart, add/remove and badge count, cart contents retained when returning to the catalog |
| `checkout.spec.js` | Full checkout happy path, required first name/last name/postal code validation |
| `order-lifecycle.spec.js` | Remove/re-add product, cancel checkout steps, order completion resets cart, logout blocks direct inventory access |
| `negative.spec.js` | Login and checkout validation failures, SQL-injection and XSS-style strings rejected, direct URL access without login redirects, logout vs. back button |
| `edge-cases.spec.js` | Multi-product cart management, sort stability across repeated changes, product detail completeness, `problem_user` and `performance_glitch_user` behavior |
| `data-driven.spec.js` | Parameterized logins over SauceDemo user types, address-format matrix for checkout, sort-option matrix, multi-product cart counts |
| `deep-flows.spec.js` | Two-product cart and checkout overview, whitespace-only first name accepted by the app (documents real app behavior), add-to-cart from the product detail page, second checkout after Back Home |
| `session-state.spec.js` | Cart survives reload, Reset App State behavior (badge clears immediately, buttons revert after reload), `problem_user` login, back/forward navigation keeps the session |
| `accessibility.spec.js` | Labeled form controls, keyboard navigation and submission, error visibility, menu button naming — accessibility-focused checks, not a WCAG conformance audit |
| `performance.spec.js` | Page-usability and flow-completion checks across login, catalog, detail, cart, checkout, sort and logout |
| `helpers.js` | Shared helpers for SauceDemo login, adding a product, and opening the cart (not a test file) |

### API — DummyJSON (`tests/api/`)

| File | Covers |
| --- | --- |
| `dummyjson.spec.js` | Products/users pagination, sorting, category filter, search, detail lookup, unknown-id 404, simulated create/update/delete, carts, posts, comments, quotes, auth login success/failure |
| `robust-api.spec.js` | Edge cases: limit/skip boundaries, invalid sort/order handling, special-character search and category, non-numeric ids, creation with missing fields, plus carts/posts/comments/quotes/auth coverage |
| `resilience.spec.js` | JSON response headers, unique ascending ids, unicode round-trip create, cart ownership and totals, empty PATCH body |

### Quality (`tests/quality/`)

| File | Covers |
| --- | --- |
| `docs-quality.spec.js` | playwright.dev landmarks, keyboard link activation with browser history, content bounds at a narrow viewport |
| `storefront-quality.spec.js` | SauceDemo keyboard login and cart operation, mobile overflow check, accessible prompts |
| `responsive.spec.js` | SauceDemo catalog/cart/login at 768px, 375px and 320px with horizontal-overflow checks; playwright.dev Docs link and search affordance |

### Docs smoke

- `tests/example.spec.js` — playwright.dev homepage and docs navigation smoke checks.

## Requirements

- Node.js 20 or later (CI uses Node 20) and npm
- Network access to install packages and browsers, and to reach all three targets

```bash
npm ci
npx playwright install --with-deps chromium firefox webkit   # Linux
```

On macOS/Windows, drop `--with-deps`: `npx playwright install chromium firefox webkit`.

## Running tests

```bash
npm test                                # all tests, all five projects
npx playwright test --project=chromium  # full suite, one browser
npx playwright test tests/ui            # SauceDemo UI suite
npx playwright test tests/api           # DummyJSON API suite
npx playwright test tests/quality       # docs and storefront quality checks
npm run test:headed                     # visible browsers
npm run test:ui                         # interactive Playwright UI mode
```

Per-suite and per-spec scripts from `package.json`:

```bash
npm run test:ui-tests        # tests/ui/
npm run test:api-tests       # tests/api/
npm run test:quality         # tests/quality/
npm run test:edge-cases      # tests/ui/edge-cases.spec.js
npm run test:negative        # tests/ui/negative.spec.js
npm run test:data-driven     # tests/ui/data-driven.spec.js
npm run test:performance     # tests/ui/performance.spec.js
npm run test:accessibility   # tests/ui/accessibility.spec.js
npm run test:robust-api      # tests/api/robust-api.spec.js
npm run test:mobile          # Mobile Chrome + Mobile Safari projects
npm run test:ci              # dot reporter, used on CI
```

An unfiltered run executes each test once per project — chromium, firefox, webkit, Mobile Chrome (Pixel 5) and Mobile Safari (iPhone 12) — so API and docs specs also run five times. Combine a path with a project filter to narrow it: `npx playwright test tests/ui --project=chromium`. Tests run in parallel per file; retries are off locally and 2 on CI.

`playwright.config.js` sets a single `baseURL` of `https://playwright.dev`. SauceDemo and DummyJSON are addressed by absolute URL from the specs; the `baseURL` does not switch per suite.

## Reports and artifacts

```bash
npm run report   # opens the latest HTML report (npx playwright show-report)
```

`playwright-report/` and `test-results/` are gitignored output. Screenshots are captured on failure, videos retained on failure, and traces recorded on the first retry. To force a trace locally: `npx playwright test tests/ui --trace on`, then `npx playwright show-trace <trace.zip>`. Traces and videos can contain page content — treat them as sensitive.

## CI

`.github/workflows/playwright.yml` runs on pushes and PRs to `main`/`master`: Node 20, `npm ci`, browser install with Linux deps, `npm run test:ci`, and uploads `playwright-report/` + `test-results/` as the `playwright-diagnostics` artifact (14-day retention) even when tests fail. CI needs the same network access to the public targets.

## Verification status

The suites have been executed and pass on Chromium and the other projects installed on the machine where they were last verified (WebKit and the mobile projects). Firefox browsers were not installed there, so Firefox was not exercised locally; CI installs it along with Chromium and WebKit. No pass counts or badges are claimed here.

## Limitations

SauceDemo and DummyJSON are public demo services outside this repo's control. Availability, content, rate limits or behavior changes on their side can fail tests regardless of test code; keep request volume modest and don't rely on persistent shared state. The UI suite depends on SauceDemo's public demo accounts (including `problem_user` and `performance_glitch_user`).

DummyJSON write endpoints are simulated: create/update/delete tests assert the response the demo API returns, not durable changes to its data. Treat them as response-contract checks, not persistence tests.
