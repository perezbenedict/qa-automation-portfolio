# QA Automation Portfolio

A Playwright Test portfolio covering a public demo storefront, a public demo REST API, and Playwright’s own documentation. It is designed to exercise browser workflows and HTTP assertions across the configured Chromium, Firefox, and WebKit projects. All targets are external services; this is not an application-under-test repository.

## Test layout and coverage

| Path | Target | Implemented coverage |
| --- | --- | --- |
| `tests/ui/authentication.spec.js` | SauceDemo (`https://www.saucedemo.com`) | Standard-user sign-in; unknown and locked-out user errors; incorrect password; required username/password validation. |
| `tests/ui/catalog.spec.js` | SauceDemo | Product name sorting in both directions; price sorting in both directions; opening product details and returning to the catalog. |
| `tests/ui/cart.spec.js` | SauceDemo | Empty cart; add/remove item and badge behavior; cart contents retained while navigating back to the catalog. |
| `tests/ui/checkout.spec.js` | SauceDemo | Checkout completion; required first name, last name, and postal code validation. |
| `tests/ui/helpers.js` | SauceDemo | Shared helpers/constants for demo login, adding the first catalog item, and opening the cart. |
| `tests/api/dummyjson.spec.js` | DummyJSON (`https://dummyjson.com`) | Product collection pagination and fields; product search/detail and unknown product; simulated product create/update/delete responses; user detail and unknown user. |
| `tests/quality/docs-quality.spec.js` | Playwright docs (`playwright.dev`) | Installation-page landmarks and heading structure; keyboard link activation and browser history; content bounds at a narrow viewport. |
| `tests/example.spec.js` | Playwright docs (`playwright.dev`) | Homepage and navigation smoke checks; installation instructions; navigation to the writing-tests guide. |

The UI helpers are limited to repeated SauceDemo interactions; the API tests use Playwright’s request fixture directly. Documentation tests use relative URLs against the configured `baseURL`. The SauceDemo helper navigates to an absolute URL, and DummyJSON requests use absolute URLs in the spec. The single configured `baseURL` is `https://playwright.dev`; it does not switch by suite or configure SauceDemo/DummyJSON targets.

## Requirements and setup

- Node.js 20 or later (CI uses Node.js 20)
- npm
- Network access to install packages and browser binaries, and to reach all three public test targets

```bash
npm ci
npx playwright install --with-deps chromium firefox webkit
```

On Linux, `--with-deps` installs required operating-system packages. On macOS or Windows, install the browsers with `npx playwright install chromium firefox webkit` if Linux system dependencies are not needed.

## Run tests

```bash
npm test                                      # full suite in Chromium, Firefox, and WebKit
npx playwright test --project=chromium        # full suite in Chromium only
npx playwright test tests/ui                  # SauceDemo UI suite
npx playwright test tests/api                 # DummyJSON API suite
npx playwright test tests/quality             # documentation quality checks
npx playwright test tests/example.spec.js     # documentation smoke tests
npm run test:headed                           # full suite with visible browsers
npm run test:ui                               # interactive Playwright UI mode
```

For a target suite in one browser, combine its path with a project filter, for example:

```bash
npx playwright test tests/ui --project=chromium
npx playwright test tests/api --project=chromium
```

The configured projects are desktop Chromium, Firefox, and WebKit, so an unfiltered run executes each matching test in all three projects (including API tests). Tests can run in parallel. Local retries are disabled; CI retries twice.

## Reports and diagnostics

Playwright writes a terminal list and an HTML report. Open the latest report with:

```bash
npm run report
# equivalent: npx playwright show-report
```

The report and `test-results/` are generated output ignored by Git. Screenshots are captured on failure, videos retained on failure, and traces recorded on the first retry. To capture a trace locally without enabling retries:

```bash
npx playwright test tests/ui --trace on
npx playwright show-trace test-results/<test-run-folder>/trace.zip
```

GitHub Actions uploads available report and test-result diagnostics as the `playwright-diagnostics` artifact, retained for 14 days. Trace, screenshot, and video artifacts may contain page content; handle them accordingly.

## External dependencies and limitations

SauceDemo and DummyJSON are public demonstration services outside this repository’s control. A full run requires internet connectivity and their availability; content, behavior, rate limits, or service-side changes can cause failures unrelated to the test code. The UI suite also relies on SauceDemo’s public demo accounts and current storefront behavior. Keep request volume modest and do not rely on shared or persistent state.

DummyJSON write endpoints are simulated: the create, update, and delete tests assert the response returned by the demo API, not durable changes to its backing data. In particular, a successful response does not mean a product was actually created, modified, or removed for future requests. Treat these as response-contract checks, not persistence or transactional tests.

## CI

`.github/workflows/playwright.yml` runs on pushes and pull requests targeting `main` or `master`. It uses `npm ci`, installs Chromium, Firefox, and WebKit with Linux dependencies, runs the full suite, and uploads available diagnostics even when tests fail. CI therefore also depends on network access to the external test targets.
