# QA Automation Portfolio

This repository is a Playwright Test suite written in plain JavaScript — no TypeScript. It exercises three public demo targets: SauceDemo (https://www.saucedemo.com) for browser UI workflows, DummyJSON (https://dummyjson.com) for REST API behavior, and playwright.dev for a small documentation smoke suite. The purpose is to demonstrate practical QA automation work: scenario design, reliable assertions, failure investigation, and honest documentation. The repository tests external services and contains no application of its own.

## What this project demonstrates

- Scenarios designed around real user-visible behavior rather than status codes alone.
- Boundary and negative testing on an API, with probed, exact expected outcomes.
- Cross-browser reliability work: a WebKit keyboard quirk, mobile navigation collapse, and a render-race investigation.
- Honest scope: usability checks, not load testing; targeted accessibility checks, not WCAG conformance; simulated API writes, not persistence.
- CI that uploads failure artifacts (HTML report and test results).

### Representative scenarios

- Checkout validation (tests/ui/checkout.spec.js): submitting without a first name must show 'First Name is required' and stay on checkout-step-one.html — either assertion alone could pass while the app misbehaved.
- API sort parameters (tests/api/robust-api.spec.js): an invalid order value returns 400 with a validation message while an unknown sortBy silently falls back to id order. The parameters fail differently, so each is asserted to its real contract.
- Whitespace-only first name (tests/ui/deep-flows.spec.js): SauceDemo accepts it; the test documents the app's actual behavior so a future change surfaces as a failure.
- Keyboard login across engines (tests/quality/storefront-quality.spec.js): Tab from username to password, then Enter. WebKit leaves the submit button out of its tab order (observed on the live site), so Enter from the password field is the portable path — noted in a code comment.

## The three targets and coverage

### SauceDemo (UI)

Authentication covers valid login, wrong password, unknown user, locked-out user, and required-field validation; parameterized logins cover SauceDemo's six seeded user types. The catalog suite checks product visibility, sorting in both directions, and detail-page navigation. Cart coverage includes add/remove, badge counts, the empty cart, and cart state across navigation. Checkout covers the happy path, required-field validation, cancellation, and order completion. Regression and edge cases include multiple products, session persistence, logout protecting direct URL access, and unusual inputs such as SQL-injection and XSS-style strings. Accessibility and responsive checks cover keyboard paths, accessible names, visible validation errors, and horizontal-overflow checks at 320, 375, and 768 px.

### DummyJSON (API)

Listing, pagination, sorting, category filter, search (every result is matched against the query), and product details. Valid and invalid identifiers are asserted against exact error responses: products return 404 and users return 400 for non-numeric ids. Boundary conditions include limit=0 returning the whole collection, limit clamping, and out-of-range and negative skip. The supported create/update/delete endpoints are validated for request and response shape — these writes are SIMULATED by DummyJSON, and tests assert the response contract (echoed fields, isDeleted/deletedOn), never persistence. Data-integrity checks cover cart totals and field types, and auth token and error contracts are asserted (login failures return 400).

### Playwright documentation

A deliberately small smoke set: homepage availability, navigation to the installation and writing-tests pages, keyboard activation with browser-history navigation, landmark/heading structure, and narrow-viewport bounds. These are kept intentionally small so they do not dominate the portfolio.

## Technology stack

- Playwright Test (browser projects and the API request fixture)
- Plain JavaScript on Node.js
- GitHub Actions CI
- Playwright HTML report with traces

No TypeScript, no extra frameworks or test libraries.

## Project structure

```
tests/
  ui/                 SauceDemo suites + helpers.js
  api/                DummyJSON suites
  quality/            storefront and responsive quality checks, docs-quality
  example.spec.js     documentation smoke
playwright.config.js
.github/workflows/playwright.yml
TESTING_NOTES.md      rationale and trade-offs
package.json          npm scripts
```

## Setup

Prerequisites: Node.js 20 or later (CI uses Node 22), npm, and network access — the tests hit live public services.

```bash
npm ci
npx playwright install chromium firefox webkit              # macOS/Windows
npx playwright install --with-deps chromium firefox webkit  # Linux
```

Browser binaries are required only for the projects that launch browsers; API tests use Playwright's request fixture.

## Running tests

```bash
npx playwright test --project=chromium    # complete UI suite in one browser
npx playwright test --project=api         # API suite once, no browser
npx playwright test --project=docs        # documentation smoke once
```

### Projects

- chromium — the complete SauceDemo UI and responsive/quality suite.
- firefox and webkit — core browser workflows (the tests/ui suite plus the SauceDemo storefront quality checks, including keyboard login).
- Mobile Chrome and Mobile Safari — the mobile-critical subset: responsive overflow checks, storefront quality checks, and the authentication, cart, and checkout journeys (Pixel 5 and iPhone 12 viewports).
- api — the DummyJSON suite, run once with no browser, so API tests are not repeated for every browser configuration.
- docs — the playwright.dev smoke suite, run once on desktop Chromium.

API and documentation tests therefore never run redundantly across unrelated browser projects.

## Reports and debugging

`npm run report` opens the HTML report (`playwright show-report`). The `playwright-report/` and `test-results/` directories are gitignored. Screenshots are captured on failure, and traces are recorded on the first retry. Local retries are off, so force one with:

```bash
npx playwright test --project=chromium --trace on
npx playwright show-trace trace.zip
```

A trace includes a screencast along with a network and console timeline. Video recording is disabled. Note that traces can contain page content.

## Verification and limitations

### Verification

Every command below was run on macOS with Node.js 22 against the live targets; the results are the ones observed, not a claim of continuous passing.

| Command | Result |
| --- | --- |
| `npm ci` | Installs cleanly, 0 vulnerabilities. |
| Syntax check (`node --check --input-type=module` per file) | All 19 JavaScript files parse. |
| `npx playwright test --project=api` | 47 passed. |
| `npx playwright test --project=docs` | 8 passed. |
| `npx playwright test --project=chromium` | 85 passed. |
| `npm run test:mobile` | 38 passed (19 per mobile project). |
| `npx playwright test --project=firefox` | 82 passed. |
| `npx playwright test --project=webkit` | 82 passed. |
| `npm test` (full matrix, 7 projects) | 342 passed in ~4 minutes. |
| `npm run report` | Serves the HTML report. |

Test counts are disjoint by design: 47 (api) + 8 (docs) + 85 (chromium) + 82 (firefox) + 82 (webkit) + 19 + 19 (mobile) = 342, so no API or documentation test runs more than once in a full run.

No CI pass is claimed here: the GitHub Actions workflow installs all three engines and runs `npm test`, but its latest status should be read from the Actions tab rather than from this document.

### Limitations

- The targets are external public services: their availability, content, or behavior can fail tests regardless of the test code. Request volume is kept modest.
- DummyJSON write operations are simulated — tests assert response contracts, not durable data changes.
- Accessibility checks are targeted automated checks (labels, keyboard paths, error visibility), not a WCAG conformance audit.
- No performance or load measurement is performed: the usability suite checks flow completion only, and no timing thresholds are asserted.
- The Firefox browser binary must be installed for firefox-project UI tests (`npx playwright install firefox`); CI installs it, a local machine may not.
- Scenario rationale and trade-offs are in [TESTING_NOTES.md](TESTING_NOTES.md).
