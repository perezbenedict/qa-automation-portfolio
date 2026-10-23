// @ts-check
import { test, expect } from '@playwright/test';
import { SAUCEDEMO_URL, loginAs, addFirstProductToCart, openCart } from '../ui/helpers.js';

test.describe('Responsive and cross-page quality', () => {
  test('catalog has no horizontal overflow at tablet width', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 812 });
    await loginAs(page);

    await expect(page.locator('[data-test="title"]')).toHaveText('Products');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(768);
  });

  test('cart page stays usable without horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loginAs(page);
    await addFirstProductToCart(page);
    await openCart(page);

    await expect(page.locator('.cart_item')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Checkout' })).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);
  });

  test('login form fits a narrow viewport without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 812 });
    await page.goto(SAUCEDEMO_URL);

    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(320);
  });
});
