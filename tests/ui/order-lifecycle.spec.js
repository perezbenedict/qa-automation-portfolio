// @ts-check
import { test, expect } from '@playwright/test';
import {
  addFirstProductToCart,
  loginAs,
  openCart,
  SAUCEDEMO_URL,
} from './helpers.js';

async function startCheckout(page) {
  const productName = await addFirstProductToCart(page);
  await openCart(page);
  await page.getByRole('button', { name: 'Checkout' }).click();
  await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
  return productName;
}

test.describe('SauceDemo order lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  });

  test('a removed catalog product can be added again', async ({ page }) => {
    const productName = await addFirstProductToCart(page);
    const product = page.locator('.inventory_item').filter({ hasText: productName });

    await expect(product.getByRole('button', { name: 'Remove' })).toBeVisible();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');

    await product.getByRole('button', { name: 'Remove' }).click();
    await expect(product.getByRole('button', { name: 'Add to cart' })).toBeVisible();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveCount(0);

    await product.getByRole('button', { name: 'Add to cart' }).click();
    await expect(product.getByRole('button', { name: 'Remove' })).toBeVisible();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');
  });

  test('canceling checkout returns to the cart with its item intact', async ({ page }) => {
    const productName = await startCheckout(page);

    await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Your Information');
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(page.getByText(productName, { exact: true })).toBeVisible();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');
  });

  test('canceling order review returns to the catalog without clearing the cart', async ({ page }) => {
    const productName = await startCheckout(page);
    await page.getByPlaceholder('First Name').fill('Taylor');
    await page.getByPlaceholder('Last Name').fill('Morgan');
    await page.getByPlaceholder('Zip/Postal Code').fill('10001');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');
    await expect(page.getByText(productName, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');
  });

  test('returning home after order confirmation resets the cart', async ({ page }) => {
    await startCheckout(page);
    await page.getByPlaceholder('First Name').fill('Taylor');
    await page.getByPlaceholder('Last Name').fill('Morgan');
    await page.getByPlaceholder('Zip/Postal Code').fill('10001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Finish' }).click();

    await expect(page).toHaveURL(/\/checkout-complete\.html$/);
    await expect(page.getByText('Thank you for your order!', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Back Home' }).click();

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveCount(0);
    await expect(page.locator('.inventory_item').first().getByRole('button', {
      name: 'Add to cart',
    })).toBeVisible();
    await openCart(page);
    await expect(page.locator('.cart_item')).toHaveCount(0);
  });

  test('logging out prevents direct access to the inventory', async ({ page }) => {
    await page.getByRole('button', { name: 'Open Menu' }).click();
    await page.getByRole('button', { name: 'Logout' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();

    await page.goto(`${SAUCEDEMO_URL}/inventory.html`);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });
});
