// @ts-check
import { test, expect } from '@playwright/test';
import { addFirstProductToCart, loginAs, openCart } from './helpers.js';

async function addNthProductToCart(page, index) {
  const product = page.locator('.inventory_item').nth(index);
  const productName = await product.locator('.inventory_item_name').innerText();
  await product.getByRole('button', { name: 'Add to cart' }).click();
  return productName;
}

async function startCheckout(page) {
  await openCart(page);
  await page.getByRole('button', { name: 'Checkout' }).click();
  await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
}

async function fillCustomerDetails(page) {
  await page.getByPlaceholder('First Name').fill('Taylor');
  await page.getByPlaceholder('Last Name').fill('Morgan');
  await page.getByPlaceholder('Zip/Postal Code').fill('10001');
}

test.describe('SauceDemo deep checkout flows', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  });

  test('removing one of two products in the cart updates the badge and keeps the other', async ({ page }) => {
    const firstName = await addFirstProductToCart(page);
    const secondName = await addNthProductToCart(page, 1);
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('2');

    await openCart(page);
    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(page.locator('.cart_item')).toHaveCount(2);
    await expect(page.getByText(firstName, { exact: true })).toBeVisible();
    await expect(page.getByText(secondName, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Continue Shopping' }).click();
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await page.locator('.inventory_item').first().getByRole('button', { name: 'Remove' }).click();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');

    await openCart(page);
    await expect(page.locator('.cart_item')).toHaveCount(1);
    await expect(page.getByText(secondName, { exact: true })).toBeVisible();
    await expect(page.getByText(firstName, { exact: true })).toHaveCount(0);
  });

  test('checkout overview lists both products with an item count of two', async ({ page }) => {
    const firstName = await addFirstProductToCart(page);
    const secondName = await addNthProductToCart(page, 1);
    await startCheckout(page);
    await fillCustomerDetails(page);
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(page.locator('.cart_item')).toHaveCount(2);
    await expect(page.getByText(firstName, { exact: true })).toBeVisible();
    await expect(page.getByText(secondName, { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(page).toHaveURL(/\/checkout-complete\.html$/);
    await expect(page.getByText('Thank you for your order!', { exact: true })).toBeVisible();
  });

  test('a whitespace-only first name is accepted at checkout', async ({ page }) => {
    await addFirstProductToCart(page);
    await startCheckout(page);

    await page.getByPlaceholder('First Name').fill('   ');
    await page.getByPlaceholder('Last Name').fill('Morgan');
    await page.getByPlaceholder('Zip/Postal Code').fill('10001');
    await page.getByRole('button', { name: 'Continue' }).click();

    // SauceDemo does not trim first-name input, so whitespace-only advances to overview.
    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(page.locator('[data-test="error"]')).toHaveCount(0);
  });

  test('adding to cart from the product detail page keeps the badge on return', async ({ page }) => {
    const firstProduct = page.locator('.inventory_item').first();
    const productName = await firstProduct.locator('.inventory_item_name').innerText();

    await firstProduct.getByRole('button', { name: `View details for ${productName}` }).first().click();
    await expect(page).toHaveURL(/\/inventory-item\.html\?id=\d+$/);
    // Wait for the settled detail layout (the page swaps renders while loading),
    // which exposes exactly one Add to cart button.
    await expect(page.locator('[data-test="back-to-products"]')).toBeVisible();
    await page.locator('[data-test="add-to-cart"]').click();
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');

    await page.getByRole('button', { name: 'Back to products' }).click();
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');
    await openCart(page);
    await expect(page.getByText(productName, { exact: true })).toBeVisible();
  });

  test('a second checkout after Back Home completes successfully', async ({ page }) => {
    await addFirstProductToCart(page);
    await startCheckout(page);
    await fillCustomerDetails(page);
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(page).toHaveURL(/\/checkout-complete\.html$/);

    await page.getByRole('button', { name: 'Back Home' }).click();
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveCount(0);

    const newProductName = await addNthProductToCart(page, 1);
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');
    await startCheckout(page);
    await fillCustomerDetails(page);
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(page.locator('.cart_item')).toHaveCount(1);
    await expect(page.getByText(newProductName, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(page).toHaveURL(/\/checkout-complete\.html$/);
    await expect(page.getByText('Thank you for your order!', { exact: true })).toBeVisible();
  });
});
