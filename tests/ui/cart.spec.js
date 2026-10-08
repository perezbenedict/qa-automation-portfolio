// @ts-check
import { test, expect } from '@playwright/test';
import { addFirstProductToCart, loginAs, openCart } from './helpers.js';

test.describe('SauceDemo cart', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  });

  test('an added product appears in the cart and can be removed', async ({ page }) => {
    const productName = await addFirstProductToCart(page);
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');

    await openCart(page);
    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(page.getByText(productName, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Remove' }).click();
    await expect(page.locator('.cart_item')).toHaveCount(0);
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveCount(0);
  });

  test('the cart can be opened without adding a product', async ({ page }) => {
    await openCart(page);

    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(page.locator('.cart_item')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Continue Shopping' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Checkout' })).toBeVisible();
  });

  test('a product remains in the cart when returning to the catalog', async ({ page }) => {
    const productName = await addFirstProductToCart(page);
    await openCart(page);
    await page.getByRole('button', { name: 'Continue Shopping' }).click();

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');
    await openCart(page);
    await expect(page.getByText(productName, { exact: true })).toBeVisible();
  });
});
