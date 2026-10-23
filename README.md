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
| `dummyjson.spec.js` | Products/users pagination, sorting in both directions, category filter, search with every-result matching, detail lookup, exact not-found messages, simulated create/update/delete response contracts, carts, posts, comments, quotes, auth login success/failure |
| `robust-api.spec.js` | Boundary and validation cases: limit/skip edges (limit=0, clamping, out-of-range skip, negative skip → 400), invalid sort parameters with exact error messages, unknown category and no-match searches, non-numeric ids (products → 404, users → 400), partial-payload creation, PATCH on a missing product, carts/posts/comments/quotes field checks, auth token and error contracts |
| `resilience.spec.js` | JSON response headers, unique ascending ids, unicode payload echoed by the simulated create, cart ownership and totals, empty PATCH body leaves the product unchanged |

### Quality (`tests/quality/`)

| File | Covers |
| --- | --- |
| `docs-quality.spec.js` | playwright.dev landmarks, keyboard link activation with browser history, content bounds at a narrow viewport |
| `storefront-quality.spec.js` | SauceDemo keyboard login and cart operation, mobile overflow check, accessible prompts |
| `responsive.spec.js` | SauceDemo catalog/cart/login at 768px, 375px and 320px with horizontal-overflow checks; playwright.dev Docs link and search affordance |

### Docs smoke

- `tests/example.spec.js` — playwright.dev homepage and docs navigation smoke checks.

## Selected scenarios

A few examples of what the tests actually pin down, and why:

- **Checkout validation** (`tests/ui/checkout.spec.js`): submitting checkout without a first name must show `First Name is required` *and* leave the URL on `checkout-step-one.html`. Checking both matters — an error banner alone would pass even if the app had already navigated away.
- **API sort parameters** (`tests/api/robust-api.spec.js`): an invalid `order` value returns 400 with the API's validation message, while an unknown `sortBy` silently falls back to natural id order. The two parameters fail differently, so each test pins down the real per-parameter contract instead of asserting a generic success status.
- **Whitespace-only first name** (`tests/ui/deep-flows.spec.js`): SauceDemo accepts a first name of only spaces. The test asserts what the app really does, so a future change to this edge case shows up as a failure; it documents behavior rather than endorsing it.
- **Keyboard login across engines** (`tests/quality/storefront-quality.spec.js`): log in with the keyboard only — Tab from username to password, then Enter. WebKit leaves the submit button out of its tab order (observed against the live site), so Enter from the password field is the portable keyboard path, and the test says so in a comment.

## Technologies

Playwright Test (browser and API request fixtures), plain JavaScript on Node.js, GitHub Actions for CI, and the Playwright HTML report with traces for debugging. No TypeScript and no extra frameworks: the suite runs with `npx playwright test`.

## Requirements

- Node.js 20 or later (CI uses Node 22) and npm
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
npm run test:ci              # dot reporter, for a quiet full run (CI itself runs npm test)
```

An unfiltered run executes each test once per project — chromium, firefox, webkit, Mobile Chrome (Pixel 5) and Mobile Safari (iPhone 12) — so API and docs specs also run five times. Combine a path with a project filter to narrow it: `npx playwright test tests/ui --project=chromium`. Tests run in parallel per file; retries are off locally and 2 on CI.

`playwright.config.js` sets a single `baseURL` of `https://playwright.dev`. SauceDemo and DummyJSON are addressed by absolute URL from the specs; the `baseURL` does not switch per suite.

## Reports and artifacts

```bash
npm run report   # opens the latest HTML report (npx playwright show-report)
```

`playwright-report/` and `test-results/` are gitignored output. Screenshots are captured on failure, videos retained on failure, and traces recorded on the first retry. To force a trace locally: `npx playwright test tests/ui --trace on`, then `npx playwright show-trace <trace.zip>`. Traces and videos can contain page content — treat them as sensitive.

## CI

`.github/workflows/playwright.yml` runs on pushes and pull requests to `main`: Node 22, `npm ci`, browser install with Linux deps, then `npm test` — the full suite, all five projects, with the list and HTML reporters. When the run fails it uploads `playwright-report/` and `test-results/` (screenshots, videos, traces) as the `playwright-report` artifact, kept for 7 days, so a red run can be investigated from the browser. The workflow uses no secrets; CI needs the same network access to the public targets as a local run.

## Verification status

The suites have been executed and pass on Chromium, WebKit, Mobile Chrome and Mobile Safari — every project installed on the machine where they were last verified. The API suite additionally runs under the firefox project (request-only tests need no browser); the firefox browser binaries were not installed there, so its UI tests were not exercised locally, and CI installs them along with Chromium and WebKit. No pass counts or badges are claimed here.

## Limitations

SauceDemo and DummyJSON are public demo services outside this repo's control. Availability, content, rate limits or behavior changes on their side can fail tests regardless of test code; keep request volume modest and don't rely on persistent shared state. The UI suite depends on SauceDemo's public demo accounts (including `problem_user` and `performance_glitch_user`).

DummyJSON write endpoints are simulated: create/update/delete tests assert the response the demo API returns, not durable changes to its data. Treat them as response-contract checks, not persistence tests.

Scenario rationale and trade-offs (why there are no screenshot baselines or wall-clock thresholds, which observed edge cases are asserted and how one flaky detail-page test was investigated) are in [TESTING_NOTES.md](TESTING_NOTES.md).
