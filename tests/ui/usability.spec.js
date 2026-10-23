// @ts-check
// Verifies pages become usable and flows complete; these are not micro-benchmarks.
import { test, expect } from '@playwright/test';
import { SAUCEDEMO_URL, loginAs, addFirstProductToCart, openCart } from './helpers.js';

test.describe('SauceDemo page usability', () => {
  test('login form renders with usable inputs and submit button', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);

    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.locator('input[placeholder="Password"][type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeEnabled();
  });

  test('successful login lands on a populated catalog', async ({ page }) => {
    await loginAs(page);

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');

    const firstItem = page.locator('.inventory_item').first();
    await expect(firstItem.locator('.inventory_item_name')).toBeVisible();
    await expect(firstItem.locator('.inventory_item_price')).toBeVisible();
  });

  test('sorting by price high-to-low reorders the visible catalog', async ({ page }) => {
    await loginAs(page);
    const productPrices = page.locator('.inventory_item_price');
    await expect(productPrices.first()).toBeVisible();
    const pricesInCatalog = (await productPrices.allTextContents()).map((price) =>
      parseFloat(price.replace('$', '')),
    );

    await page.locator('[data-test="product-sort-container"]').selectOption('hilo');
    await expect.poll(async () =>
      (await productPrices.allTextContents()).map((price) => parseFloat(price.replace('$', ''))),
    ).toEqual([...pricesInCatalog].sort((a, b) => b - a));
  });

  test('cart accepts a product and exposes checkout', async ({ page }) => {
    await loginAs(page);
    const productName = await addFirstProductToCart(page);

    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');

    await openCart(page);
    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(page.getByText(productName, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Checkout' })).toBeEnabled();
  });

  test('complete checkout reaches the order confirmation', async ({ page }) => {
    await loginAs(page);
    await addFirstProductToCart(page);
    await openCart(page);

    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByPlaceholder('First Name').fill('Taylor');
    await page.getByPlaceholder('Last Name').fill('Morgan');
    await page.getByPlaceholder('Zip/Postal Code').fill('10001');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(page.locator('[data-test="total-label"]')).toContainText('Total:');

    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(page).toHaveURL(/\/checkout-complete\.html$/);
    await expect(page.getByText('Thank you for your order!', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Back Home' }).click();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveCount(0);
  });
});
