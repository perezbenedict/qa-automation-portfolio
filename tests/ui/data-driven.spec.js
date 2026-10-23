// @ts-check
import { test, expect } from '@playwright/test';
import { loginAs, openCart, SAUCEDEMO_URL, STANDARD_USER, DEMO_PASSWORD } from '../ui/helpers.js';

const TEST_USERS = [
  { name: 'standard_user', password: DEMO_PASSWORD, shouldSucceed: true, description: 'Standard user' },
  { name: 'locked_out_user', password: DEMO_PASSWORD, shouldSucceed: false, description: 'Locked out user' },
  { name: 'problem_user', password: DEMO_PASSWORD, shouldSucceed: true, description: 'Problem user' },
  { name: 'performance_glitch_user', password: DEMO_PASSWORD, shouldSucceed: true, description: 'Performance glitch user', timeout: 15000 },
  { name: 'error_user', password: DEMO_PASSWORD, shouldSucceed: true, description: 'Error user' },
  { name: 'visual_user', password: DEMO_PASSWORD, shouldSucceed: true, description: 'Visual user' },
];

// Required-field validation lives in checkout.spec.js; these rows cover
// special-character and unicode input only.
const CHECKOUT_FIELDS = [
  { firstName: 'Maria', lastName: 'García', zip: '28001', description: 'Valid Spanish address with accent' },
  { firstName: 'Jean-Pierre', lastName: 'O\'Connor', zip: '75001', description: 'Valid French/Irish address with apostrophe' },
  { firstName: '田中', lastName: '太郎', zip: '100-0001', description: 'Valid Japanese address' },
];

test.describe('SauceDemo data-driven tests', () => {
  test.describe('Login with different user types', () => {
    for (const user of TEST_USERS) {
      test(`${user.description} (${user.name}) ${user.shouldSucceed ? 'can' : 'cannot'} sign in`, async ({ page }) => {
        await page.goto(SAUCEDEMO_URL);
        await page.getByPlaceholder('Username').fill(user.name);
        await page.getByPlaceholder('Password').fill(user.password);
        await page.getByRole('button', { name: 'Login' }).click();

        if (user.shouldSucceed) {
          // performance_glitch_user deliberately delays; allow extra time for it.
          await expect(page).toHaveURL(/\/inventory\.html$/, { timeout: user.timeout ?? 5000 });
          await expect(page.locator('[data-test="title"]')).toHaveText('Products', { timeout: user.timeout ?? 5000 });
        } else {
          await expect(page.locator('[data-test="error"]')).toBeVisible();
          await expect(page).toHaveURL(/\/$/);
        }
      });
    }
  });

  test.describe('Checkout with various address formats', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page);
      const firstProduct = page.locator('.inventory_item').first();
      await firstProduct.getByRole('button', { name: 'Add to cart' }).click();
      await openCart(page);
      await page.getByRole('button', { name: 'Checkout' }).click();
      await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
    });

    for (const fields of CHECKOUT_FIELDS) {
      test(fields.description, async ({ page }) => {
        await page.getByPlaceholder('First Name').fill(fields.firstName);
        await page.getByPlaceholder('Last Name').fill(fields.lastName);
        await page.getByPlaceholder('Zip/Postal Code').fill(fields.zip);
        await page.getByRole('button', { name: 'Continue' }).click();

        await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
        await page.goBack();
        await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
      });
    }
  });

  test.describe('Multiple products in cart scenarios', () => {
    const productCounts = [1, 3];

    for (const count of productCounts) {
      test(`adding ${count} product(s) to cart`, async ({ page }) => {
        await loginAs(page);

        const products = page.locator('.inventory_item');
        await expect(products.first()).toBeVisible();
        const totalProducts = await products.count();
        const productsToAdd = Math.min(count, totalProducts);

        for (let i = 0; i < productsToAdd; i++) {
          const product = products.nth(i);
          await product.getByRole('button', { name: 'Add to cart' }).click();
        }

        await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText(String(productsToAdd), { timeout: 5000 });

        await openCart(page);
        await expect(page.locator('.cart_item')).toHaveCount(productsToAdd);
      });
    }
  });
});