// @ts-check
import { test, expect } from '@playwright/test';
import { loginAs, SAUCEDEMO_URL, STANDARD_USER, DEMO_PASSWORD } from '../ui/helpers.js';

test.describe('SauceDemo visual regression', () => {
  test('login page matches baseline', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);
    await expect(page).toHaveScreenshot('login-page.png', { fullPage: true });
  });

  test('product catalog matches baseline', async ({ page }) => {
    await loginAs(page);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
    await expect(page).toHaveScreenshot('product-catalog.png', { fullPage: true });
  });

  test('product detail page matches baseline', async ({ page }) => {
    await loginAs(page);
    const firstProduct = page.locator('.inventory_item').first();
    const productName = await firstProduct.locator('.inventory_item_name').innerText();
    await firstProduct.getByRole('button', { name: `View details for ${productName}` }).first().click();
    await expect(page).toHaveURL(/\/inventory-item\.html\?id=\d+$/);
    await expect(page).toHaveScreenshot('product-detail.png', { fullPage: true });
  });

  test('cart page with item matches baseline', async ({ page }) => {
    await loginAs(page);
    const firstProduct = page.locator('.inventory_item').first();
    await firstProduct.getByRole('button', { name: 'Add to cart' }).click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(page).toHaveScreenshot('cart-with-item.png', { fullPage: true });
  });

  test('checkout step one matches baseline', async ({ page }) => {
    await loginAs(page);
    const firstProduct = page.locator('.inventory_item').first();
    await firstProduct.getByRole('button', { name: 'Add to cart' }).click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
    await expect(page).toHaveScreenshot('checkout-step-one.png', { fullPage: true });
  });

  test('checkout step two matches baseline', async ({ page }) => {
    await loginAs(page);
    const firstProduct = page.locator('.inventory_item').first();
    await firstProduct.getByRole('button', { name: 'Add to cart' }).click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByPlaceholder('First Name').fill('John');
    await page.getByPlaceholder('Last Name').fill('Doe');
    await page.getByPlaceholder('Zip/Postal Code').fill('10001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(page).toHaveScreenshot('checkout-step-two.png', { fullPage: true });
  });

  test('checkout complete matches baseline', async ({ page }) => {
    await loginAs(page);
    const firstProduct = page.locator('.inventory_item').first();
    await firstProduct.getByRole('button', { name: 'Add to cart' }).click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByPlaceholder('First Name').fill('John');
    await page.getByPlaceholder('Last Name').fill('Doe');
    await page.getByPlaceholder('Zip/Postal Code').fill('10001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(page).toHaveURL(/\/checkout-complete\.html$/);
    await expect(page).toHaveScreenshot('checkout-complete.png', { fullPage: true });
  });

  test('mobile view catalog matches baseline', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginAs(page);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
    await expect(page).toHaveScreenshot('mobile-catalog.png', { fullPage: true });
  });

  test('mobile view cart matches baseline', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginAs(page);
    const firstProduct = page.locator('.inventory_item').first();
    await firstProduct.getByRole('button', { name: 'Add to cart' }).click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(page).toHaveScreenshot('mobile-cart.png', { fullPage: true });
  });

  test('problem user catalog matches baseline', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);
    await loginAs(page, 'problem_user', DEMO_PASSWORD);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
    await expect(page).toHaveScreenshot('problem-user-catalog.png', { fullPage: true });
  });
});