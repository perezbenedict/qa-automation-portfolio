# Testing notes

Rationale and trade-offs that would bloat the README. Each note points at the code it describes.

## Why these scenarios

- **Checkout validation asserts message *and* URL** (`tests/ui/checkout.spec.js`). Checking only for the error banner would still pass if the app navigated to step two anyway; checking only the URL would pass if a generic error appeared. Both together prove the form blocked progress for the right reason.
- **One parameterized login suite instead of six copies** (`tests/ui/data-driven.spec.js`). SauceDemo ships six seeded users with deliberately different behaviors (locked-out, slow, broken images). The table drives them through the same assertions; each row carries its own expected outcome, including the slower timeout for `performance_glitch_user`.
- **API sort parameters tested separately** (`tests/api/robust-api.spec.js`). Probing the live API showed `order=invalid` returns 400 with a message but `sortBy=unknown` silently falls back to id order. One generic "sorting works" test would have hidden that difference, so each parameter gets an assertion matching its real contract.

## Observed edge cases worth keeping

- `limit=0` on DummyJSON returns the *entire* collection with `limit` echoed as `total` — not an empty page. Asserted as observed, since it is non-obvious.
- Error shapes differ by resource: `/products/abc` returns 404, `/users/abc` returns 400 `Invalid user id 'abc'`. Tests assert each endpoint's actual contract rather than a shared one.
- Search is case-insensitive **substring** matching over text fields, not token matching — `q=phone case` returns 0 results because the phrase is not contiguous. Asserted as an empty result set with `total: 0`.
- A whitespace-only first name passes SauceDemo checkout validation (`tests/ui/deep-flows.spec.js`). The test documents that behavior; if the app later rejects it, the test fails and the expectation gets revisited.

## Trade-offs

- **No screenshot baselines.** Visual comparison tests were tried and removed: baselines recorded against a public demo site churned with the site's own asset and layout updates, producing failures that described the site's redeployments rather than the app's behavior. The same flows remain covered by functional assertions.
- **No wall-clock performance thresholds.** Latency of public services varies run to run; a fixed number would be flaky and would measure the network, not the app. `tests/ui/usability.spec.js` asserts usability and flow completion and is named accordingly. Load testing is out of scope for this repo.
- **Accessibility checks are targeted, not a conformance audit.** They verify labeled controls, keyboard paths, focus behavior and error visibility. Automated checks cannot establish WCAG compliance, and none is claimed.
- **DummyJSON writes are simulated.** Verified against the live API: a fresh `GET /products/1` after `DELETE` still returns the original product. Create/update/delete tests assert the response contract (echoed fields, `isDeleted`, `deletedOn`) and never claim persistence.

## One investigation, documented

SauceDemo's product detail page intermittently rendered two different layouts while loading. A test clicking `Add to cart` by role failed two ways depending on timing: a strict-mode violation (six matching buttons in the transient layout) and a click that never stabilized. The fix waits for the settled-layout marker (`[data-test="back-to-products"]`, present only in the final layout) before clicking the unambiguous `[data-test="add-to-cart"]` control — see `tests/ui/deep-flows.spec.js`. Related: WebKit leaves that form's submit button out of its tab order on the login page, so the keyboard tests submit with Enter from the password field instead (comments in `tests/quality/storefront-quality.spec.js` and `tests/ui/accessibility.spec.js`).
