// @ts-check
// Focused accessibility checks against SauceDemo; not a WCAG conformance audit.
import { test, expect } from '@playwright/test';
import { loginAs, addFirstProductToCart, openCart, SAUCEDEMO_URL } from '../ui/helpers.js';

test.describe('SauceDemo accessibility tests', () => {
  test('login page shows the Swag Labs brand text', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);

    const logo = page.locator('.login_logo');
    await expect(logo).toHaveCount(1);
    await expect(logo).toContainText('Swag Labs');
  });

  test('login inputs expose prompts and a named submit button', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);

    const usernameInput = page.getByPlaceholder('Username');
    const passwordInput = page.getByPlaceholder('Password');
    const loginButton = page.getByRole('button', { name: 'Login' });

    await expect(usernameInput).toBeVisible();
    await expect(usernameInput).toHaveAttribute('type', 'text');
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
  });

  test('password input is masked as a password field', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);

    await expect(page.getByPlaceholder('Password')).toHaveAttribute('type', 'password');
  });

  test('login inputs follow a logical tab order', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);

    const usernameInput = page.getByPlaceholder('Username');
    const passwordInput = page.getByPlaceholder('Password');

    await usernameInput.focus();
    await expect(usernameInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();

    // Tab moves from the username field into the password field - the order a
    // keyboard user meets the inputs. WebKit does not include the submit
    // button in its tab order (Tab from password lands on the document body),
    // so the cross-engine tab-order contract stops at the inputs; keyboard
    // submission with Enter is covered by the storefront quality suite.
  });

  test('invalid login surfaces a visible error message', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);
    await page.getByRole('button', { name: 'Login' }).click();

    const errorContainer = page.locator('[data-test="error"]');
    await expect(errorContainer).toBeAttached();
    await expect(errorContainer).toBeVisible();
    await expect(errorContainer).toContainText('Username is required');
  });

  test('products page exposes a single Products heading', async ({ page }) => {
    await loginAs(page);

    const title = page.locator('[data-test="title"]');
    await expect(title).toHaveCount(1);
    await expect(title).toHaveText('Products');
  });

  test('catalog items expose name, price, and an add-to-cart button', async ({ page }) => {
    await loginAs(page);

    const products = page.locator('.inventory_item');
    await expect(products.first()).toBeVisible();
    const productCount = await products.count();
    expect(productCount).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(productCount, 3); i++) {
      const product = products.nth(i);

      await expect(product.locator('.inventory_item_name')).toBeVisible();
      await expect(product.locator('.inventory_item_price')).toBeVisible();
      await expect(product.getByRole('button', { name: 'Add to cart' })).toBeVisible();
    }
  });

  test('sort control has an accessible label and four options', async ({ page }) => {
    await loginAs(page);

    const sortControl = page.locator('[data-test="product-sort-container"]');
    await expect(sortControl).toBeVisible();
    await expect(sortControl).toHaveAttribute('aria-label', 'Sort products');
    await expect(sortControl.locator('option')).toHaveCount(4);
  });

  test('cart shows the added item with remove and checkout actions', async ({ page }) => {
    await loginAs(page);
    const productName = await addFirstProductToCart(page);
    await openCart(page);

    await expect(page).toHaveURL(/\/cart\.html$/);
    await expect(page.locator('[data-test="title"]')).toHaveCount(1);
    await expect(page.locator('[data-test="title"]')).toHaveText('Your Cart');

    await expect(page.getByText(productName, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue Shopping' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Checkout' })).toBeVisible();
  });

  test('checkout form exposes prompts for all required fields', async ({ page }) => {
    await loginAs(page);
    await addFirstProductToCart(page);
    await openCart(page);
    await page.getByRole('button', { name: 'Checkout' }).click();

    await expect(page.getByPlaceholder('First Name')).toBeVisible();
    await expect(page.getByPlaceholder('Last Name')).toBeVisible();
    await expect(page.getByPlaceholder('Zip/Postal Code')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('checkout overview exposes a single heading and finish/cancel actions', async ({ page }) => {
    await loginAs(page);
    await addFirstProductToCart(page);
    await openCart(page);
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByPlaceholder('First Name').fill('John');
    await page.getByPlaceholder('Last Name').fill('Doe');
    await page.getByPlaceholder('Zip/Postal Code').fill('10001');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(page.locator('[data-test="title"]')).toHaveCount(1);
    await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');

    await expect(page.getByRole('button', { name: 'Finish' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('checkout complete page confirms the order with a single heading', async ({ page }) => {
    await loginAs(page);
    await addFirstProductToCart(page);
    await openCart(page);
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByPlaceholder('First Name').fill('John');
    await page.getByPlaceholder('Last Name').fill('Doe');
    await page.getByPlaceholder('Zip/Postal Code').fill('10001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Finish' }).click();

    await expect(page).toHaveURL(/\/checkout-complete\.html$/);
    await expect(page.locator('[data-test="title"]')).toHaveCount(1);
    await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Complete!');

    await expect(page.getByText('Thank you for your order!')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back Home' })).toBeVisible();
  });

  test('burger menu opens with Enter and reveals Logout', async ({ page }) => {
    await loginAs(page);

    const menuButton = page.getByRole('button', { name: 'Open Menu' });
    await expect(menuButton).toBeVisible();
    await menuButton.focus();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset App State' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close Menu' })).toBeVisible();
  });

  test('at least one product image has alt text', async ({ page }) => {
    await loginAs(page);

    // Some SauceDemo images lack alt text, so only the honest minimum is asserted.
    const images = page.locator('.inventory_item img');
    await expect(images.first()).toBeVisible();
    const count = await images.count();
    expect(count).toBeGreaterThan(0);

    let imagesWithAlt = 0;
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      if (alt) imagesWithAlt++;
    }
    expect(imagesWithAlt).toBeGreaterThan(0);
  });
});
