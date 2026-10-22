// @ts-check
import { test, expect } from '@playwright/test';
import { loginAs, addFirstProductToCart, openCart, SAUCEDEMO_URL, STANDARD_USER, DEMO_PASSWORD } from '../ui/helpers.js';

test.describe('SauceDemo performance tests', () => {
  test('login page loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(SAUCEDEMO_URL);
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('authentication completes within acceptable time', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);
    const startTime = Date.now();
    await loginAs(page);
    const authTime = Date.now() - startTime;
    expect(authTime).toBeLessThan(3000);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  });

  test('catalog page renders within acceptable time', async ({ page }) => {
    await loginAs(page);
    const startTime = Date.now();
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
    await expect(page.locator('.inventory_item').first()).toBeVisible();
    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(2000);
  });

  test('product detail page loads within acceptable time', async ({ page }) => {
    await loginAs(page);
    const firstProduct = page.locator('.inventory_item').first();
    const productName = await firstProduct.locator('.inventory_item_name').innerText();

    const startTime = Date.now();
    await firstProduct.getByRole('button', { name: `View details for ${productName}` }).first().click();
    await expect(page).toHaveURL(/\/inventory-item\.html\?id=\d+$/);
    await expect(page.getByText(productName, { exact: true })).toBeVisible();
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });

  test('cart operations complete within acceptable time', async ({ page }) => {
    await loginAs(page);

    const addStartTime = Date.now();
    await addFirstProductToCart(page);
    const addTime = Date.now() - addStartTime;
    expect(addTime).toBeLessThan(1000);

    const cartStartTime = Date.now();
    await openCart(page);
    await expect(page.locator('.cart_item')).toHaveCount(1);
    const cartTime = Date.now() - cartStartTime;
    expect(cartTime).toBeLessThan(1000);
  });

  test('checkout flow completes within acceptable time', async ({ page }) => {
    await loginAs(page);
    await addFirstProductToCart(page);
    await openCart(page);

    const startTime = Date.now();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByPlaceholder('First Name').fill('John');
    await page.getByPlaceholder('Last Name').fill('Doe');
    await page.getByPlaceholder('Zip/Postal Code').fill('10001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(page.getByText('Thank you for your order!')).toBeVisible();
    const checkoutTime = Date.now() - startTime;
    expect(checkoutTime).toBeLessThan(5000);
  });

  test('sort operations respond within acceptable time', async ({ page }) => {
    await loginAs(page);
    const sortControl = page.locator('[data-test="product-sort-container"]');

    for (const option of ['az', 'za', 'lohi', 'hilo']) {
      const startTime = Date.now();
      await sortControl.selectOption(option);
      await page.waitForTimeout(100);
      const sortTime = Date.now() - startTime;
      expect(sortTime).toBeLessThan(1000);
    }
  });

  test('page navigation between steps is fast', async ({ page }) => {
    await loginAs(page);
    await addFirstProductToCart(page);
    await openCart(page);

    const navTimes = [];

    const step1Start = Date.now();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
    navTimes.push(Date.now() - step1Start);

    const step2Start = Date.now();
    await page.getByPlaceholder('First Name').fill('John');
    await page.getByPlaceholder('Last Name').fill('Doe');
    await page.getByPlaceholder('Zip/Postal Code').fill('10001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    navTimes.push(Date.now() - step2Start);

    const step3Start = Date.now();
    await page.getByRole('button', { name: 'Finish' }).click();
    await expect(page).toHaveURL(/\/checkout-complete\.html$/);
    navTimes.push(Date.now() - step3Start);

    for (const time of navTimes) {
      expect(time).toBeLessThan(2000);
    }
  });

  test('logout is immediate', async ({ page }) => {
    await loginAs(page);
    const startTime = Date.now();
    await page.getByRole('button', { name: 'Open Menu' }).click();
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/$/);
    const logoutTime = Date.now() - startTime;
    expect(logoutTime).toBeLessThan(1000);
  });
});