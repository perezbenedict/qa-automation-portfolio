// @ts-check
import { test, expect } from '@playwright/test';
import { loginAs, openCart, SAUCEDEMO_URL, STANDARD_USER, DEMO_PASSWORD } from './helpers.js';

test.describe('SauceDemo negative and error scenarios', () => {
  test('login with empty username shows error', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.locator('[data-test="error"]')).toContainText('Username is required');
  });

  test('login with empty password shows error', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);
    await page.getByPlaceholder('Username').fill(STANDARD_USER);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.locator('[data-test="error"]')).toContainText('Password is required');
  });

  test('login with SQL injection attempt is rejected', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);
    await page.getByPlaceholder('Username').fill("' OR '1'='1");
    await page.getByPlaceholder('Password').fill("' OR '1'='1");
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.locator('[data-test="error"]')).toContainText('do not match');
  });

  test('login with XSS attempt in username is rejected', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);
    await page.getByPlaceholder('Username').fill('<script>alert(1)</script>');
    await page.getByPlaceholder('Password').fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.locator('[data-test="error"]')).toContainText('do not match');
  });

  test('locked_out_user cannot sign in', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);
    await page.getByPlaceholder('Username').fill('locked_out_user');
    await page.getByPlaceholder('Password').fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.locator('[data-test="error"]')).toContainText('locked out');
  });

  test('checkout with empty first name shows error', async ({ page }) => {
    await loginAs(page);
    const firstProduct = page.locator('.inventory_item').first();
    await firstProduct.getByRole('button', { name: 'Add to cart' }).click();
    await openCart(page);
    await page.getByRole('button', { name: 'Checkout' }).click();

    await page.getByPlaceholder('Last Name').fill('Morgan');
    await page.getByPlaceholder('Zip/Postal Code').fill('10001');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.locator('[data-test="error"]')).toContainText('First Name is required');
  });

  test('checkout with empty last name shows error', async ({ page }) => {
    await loginAs(page);
    const firstProduct = page.locator('.inventory_item').first();
    await firstProduct.getByRole('button', { name: 'Add to cart' }).click();
    await openCart(page);
    await page.getByRole('button', { name: 'Checkout' }).click();

    await page.getByPlaceholder('First Name').fill('Taylor');
    await page.getByPlaceholder('Zip/Postal Code').fill('10001');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.locator('[data-test="error"]')).toContainText('Last Name is required');
  });

  test('checkout with empty zip code shows error', async ({ page }) => {
    await loginAs(page);
    const firstProduct = page.locator('.inventory_item').first();
    await firstProduct.getByRole('button', { name: 'Add to cart' }).click();
    await openCart(page);
    await page.getByRole('button', { name: 'Checkout' }).click();

    await page.getByPlaceholder('First Name').fill('Taylor');
    await page.getByPlaceholder('Last Name').fill('Morgan');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.locator('[data-test="error"]')).toContainText('Postal Code is required');
  });

  test('checkout with special characters in fields works', async ({ page }) => {
    await loginAs(page);
    const firstProduct = page.locator('.inventory_item').first();
    await firstProduct.getByRole('button', { name: 'Add to cart' }).click();
    await openCart(page);
    await page.getByRole('button', { name: 'Checkout' }).click();

    await page.getByPlaceholder('First Name').fill("O'Connor");
    await page.getByPlaceholder('Last Name').fill('Smith-Jones');
    await page.getByPlaceholder('Zip/Postal Code').fill('10001-1234');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
  });

  test('direct URL access to cart without login redirects to login', async ({ page }) => {
    await page.goto(`${SAUCEDEMO_URL}/cart.html`);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('direct URL access to checkout without login redirects to login', async ({ page }) => {
    await page.goto(`${SAUCEDEMO_URL}/checkout-step-one.html`);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('direct URL access to inventory without login redirects to login', async ({ page }) => {
    await page.goto(`${SAUCEDEMO_URL}/inventory.html`);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('logout then back button does not restore session', async ({ page }) => {
    await loginAs(page);
    await page.getByRole('button', { name: 'Open Menu' }).click();
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });
});