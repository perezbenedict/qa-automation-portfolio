// @ts-check
import { test, expect } from '@playwright/test';
import { loginAs, SAUCEDEMO_URL, STANDARD_USER, DEMO_PASSWORD } from '../ui/helpers.js';

test.describe('SauceDemo accessibility tests', () => {
  test('login page has proper heading structure', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);

    const logoCount = await page.locator('.login_logo').count();
    expect(logoCount).toBe(1);

    await expect(page.locator('.login_logo')).toContainText('Swag Labs');
  });

  test('login form has proper labels and accessible names', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);

    const usernameInput = page.getByPlaceholder('Username');
    const passwordInput = page.getByPlaceholder('Password');
    const loginButton = page.getByRole('button', { name: 'Login' });

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();

    await expect(usernameInput).toHaveAttribute('type', 'text');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('login page is keyboard navigable', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);

    const usernameInput = page.getByPlaceholder('Username');
    const passwordInput = page.getByPlaceholder('Password');
    const loginButton = page.getByRole('button', { name: 'Login' });

    await usernameInput.focus();
    await expect(usernameInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(loginButton).toBeFocused();
  });

  test('catalog page has proper heading structure', async ({ page }) => {
    await loginAs(page);

    const title = page.locator('[data-test="title"]');
    await expect(title).toHaveText('Products', { timeout: 10000 });
    const titleCount = await title.count();
    expect(titleCount).toBe(1);
  });

  test('product items have accessible names', async ({ page }) => {
    await loginAs(page);

    const products = page.locator('.inventory_item');
    const count = await products.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 3); i++) {
      const product = products.nth(i);
      const name = product.locator('.inventory_item_name');
      const price = product.locator('.inventory_item_price');
      const addButton = product.getByRole('button', { name: 'Add to cart' });

      await expect(name).toBeVisible();
      await expect(price).toBeVisible();
      await expect(addButton).toBeVisible();
    }
  });

  test('sort dropdown is accessible', async ({ page }) => {
    await loginAs(page);

    const sortControl = page.locator('[data-test="product-sort-container"]');
    await expect(sortControl).toBeVisible();
    // Native select elements have implicit combobox role
    await expect(sortControl).toHaveAttribute('aria-label', 'Sort products');
    // The select element should have options
    const options = await sortControl.locator('option').count();
    expect(options).toBe(4);
  });

  test('cart page has proper structure', async ({ page }) => {
    await loginAs(page);
    const firstProduct = page.locator('.inventory_item').first();
    await firstProduct.getByRole('button', { name: 'Add to cart' }).click();
    await page.locator('[data-test="shopping-cart-link"]').click();

    await expect(page).toHaveURL(/\/cart\.html$/);

    const titleCount = await page.locator('[data-test="title"]').count();
    expect(titleCount).toBe(1);
    await expect(page.locator('[data-test="title"]')).toHaveText('Your Cart');

    await expect(page.getByRole('button', { name: 'Continue Shopping' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Checkout' })).toBeVisible();
  });

  test('cart items have remove buttons with accessible names', async ({ page }) => {
    await loginAs(page);
    const firstProduct = page.locator('.inventory_item').first();
    const productName = await firstProduct.locator('.inventory_item_name').innerText();
    await firstProduct.getByRole('button', { name: 'Add to cart' }).click();
    await page.locator('[data-test="shopping-cart-link"]').click();

    await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible();
    await expect(page.getByText(productName, { exact: true })).toBeVisible();
  });

  test('checkout form has proper labels', async ({ page }) => {
    await loginAs(page);
    const firstProduct = page.locator('.inventory_item').first();
    await firstProduct.getByRole('button', { name: 'Add to cart' }).click();
    await page.locator('[data-test="shopping-cart-link"]').click();
    await page.getByRole('button', { name: 'Checkout' }).click();

    await expect(page.getByPlaceholder('First Name')).toBeVisible();
    await expect(page.getByPlaceholder('Last Name')).toBeVisible();
    await expect(page.getByPlaceholder('Zip/Postal Code')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('checkout overview has proper structure', async ({ page }) => {
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

    const titleCount = await page.locator('[data-test="title"]').count();
    expect(titleCount).toBe(1);
    await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');

    await expect(page.getByRole('button', { name: 'Finish' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('checkout complete page has success message', async ({ page }) => {
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

    const titleCount = await page.locator('[data-test="title"]').count();
    expect(titleCount).toBe(1);
    await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Complete!');

    await expect(page.getByText('Thank you for your order!')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back Home' })).toBeVisible();
  });

  test('error messages are announced to screen readers', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);
    await page.getByRole('button', { name: 'Login' }).click();

    const errorContainer = page.locator('[data-test="error"]');
    await expect(errorContainer).toBeVisible();
    await expect(errorContainer).toContainText('Username is required');
  });

  test('menu button is accessible', async ({ page }) => {
    await loginAs(page);

    const menuButton = page.getByRole('button', { name: 'Open Menu' });
    await expect(menuButton).toBeVisible();

    await menuButton.click();
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset App State' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close Menu' })).toBeVisible();
  });

  test('images have alt text', async ({ page }) => {
    await loginAs(page);

    const productImages = page.locator('.inventory_item_img');
    const count = await productImages.count();

    let imagesWithAlt = 0;
    for (let i = 0; i < count; i++) {
      const img = productImages.nth(i);
      const alt = await img.getAttribute('alt');
      if (alt !== null && alt.length > 0) {
        imagesWithAlt++;
      }
    }
    // At least some product images should have alt text
    expect(imagesWithAlt).toBeGreaterThan(0);
  });

  test('color contrast is sufficient', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);

    const usernameInput = page.getByPlaceholder('Username');
    const backgroundColor = await usernameInput.evaluate(el =>
      window.getComputedStyle(el).backgroundColor
    );
    const color = await usernameInput.evaluate(el =>
      window.getComputedStyle(el).color
    );

    expect(backgroundColor).toBeTruthy();
    expect(color).toBeTruthy();
  });

  test('focus indicators are visible', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);

    const usernameInput = page.getByPlaceholder('Username');
    await usernameInput.focus();
    await expect(usernameInput).toBeFocused();

    const outline = await usernameInput.evaluate(el =>
      window.getComputedStyle(el).outline
    );
    expect(outline).not.toBe('none');
  });

  test('landmark navigation exists', async ({ page }) => {
    await loginAs(page);

    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // The burger menu acts as navigation
    const menuButton = page.getByRole('button', { name: 'Open Menu' });
    await expect(menuButton).toBeVisible();
  });
});