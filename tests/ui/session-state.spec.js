// @ts-check
import { test, expect } from '@playwright/test';
import { addFirstProductToCart, loginAs, openCart, DEMO_PASSWORD } from './helpers.js';

async function resetAppState(page) {
  await page.getByRole('button', { name: 'Open Menu' }).click();
  await page.getByRole('button', { name: 'Reset App State' }).click();
  await page.getByRole('button', { name: 'Close Menu' }).click();
}

test.describe('SauceDemo session and app state', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  });

  test('app state persists across page reloads', async ({ page }) => {
    await addFirstProductToCart(page);
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');

    await page.reload();

    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');
  });

  test('reset app state clears the cart and reverts product buttons', async ({ page }) => {
    await addFirstProductToCart(page);
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');

    await resetAppState(page);

    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveCount(0);
    // The rendered button only reverts to 'Add to cart' after a reload.
    await page.reload();
    await expect(page.locator('.inventory_item').first().getByRole('button', { name: 'Add to cart' })).toBeVisible();
  });

  test('reset app state after a full checkout returns a clean catalog', async ({ page }) => {
    await addFirstProductToCart(page);
    await openCart(page);
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByPlaceholder('First Name').fill('Taylor');
    await page.getByPlaceholder('Last Name').fill('Morgan');
    await page.getByPlaceholder('Zip/Postal Code').fill('10001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(page).toHaveURL(/\/checkout-complete\.html$/);
    await page.getByRole('button', { name: 'Back Home' }).click();
    await expect(page).toHaveURL(/\/inventory\.html$/);

    await resetAppState(page);

    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveCount(0);
    await expect(page.locator('.inventory_item').first().getByRole('button', { name: 'Add to cart' })).toBeVisible();
  });

  test('the problem user reaches the catalog with usable product buttons', async ({ page }) => {
    await loginAs(page, 'problem_user', DEMO_PASSWORD);

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
    await expect(
      page.locator('.inventory_item').first().getByRole('button', { name: /^(Add to cart|Remove)$/ })
    ).toBeVisible();
  });

  test('browser back and forward navigation preserves the authenticated inventory page', async ({ page }) => {
    await page.goBack();
    await expect(page).not.toHaveURL(/\/inventory\.html$/);

    await page.goForward();

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  });
});
