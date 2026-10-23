// @ts-check
import { test, expect } from '@playwright/test';
import { DEMO_PASSWORD, SAUCEDEMO_URL, STANDARD_USER } from '../ui/helpers.js';

test.describe('SauceDemo storefront quality', () => {
  test('keyboard users can submit the login form with Enter', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);

    const username = page.getByPlaceholder('Username');
    const password = page.getByPlaceholder('Password');

    await username.focus();
    await expect(username).toBeFocused();
    await page.keyboard.type(STANDARD_USER);
    await page.keyboard.press('Tab');
    await expect(password).toBeFocused();
    await page.keyboard.type(DEMO_PASSWORD);
    // Pressing Enter in the password field submits the form in every engine.
    // WebKit omits the submit button from its tab order, so tabbing to it
    // first would not be a portable keyboard flow.
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  });

  test('login and catalog remain usable without horizontal overflow on mobile', async ({ page }) => {
    const viewportWidth = 375;
    await page.setViewportSize({ width: viewportWidth, height: 812 });
    await page.goto(SAUCEDEMO_URL);

    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await page.getByPlaceholder('Username').fill(STANDARD_USER);
    await page.getByPlaceholder('Password').fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
    await expect(page.getByRole('button', { name: 'Add to cart' }).first()).toBeVisible();

    const documentWidth = await page.evaluate(() =>
      Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    );
    expect(documentWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test('login fields show usable prompts and the submit button has a name', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);

    await expect(page.getByPlaceholder('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('the first catalog item can be added to the cart from the keyboard', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);
    await page.getByPlaceholder('Username').fill(STANDARD_USER);
    await page.getByPlaceholder('Password').fill(DEMO_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();

    const addToCartButton = page.getByRole('button', { name: 'Add to cart' }).first();
    await addToCartButton.focus();
    await expect(addToCartButton).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('button', { name: 'Remove' }).first()).toBeVisible();
    await expect(page.getByText('1', { exact: true })).toBeVisible();
  });
});
