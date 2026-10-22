// @ts-check
import { test, expect } from '@playwright/test';
import { loginAs, openCart, SAUCEDEMO_URL, STANDARD_USER, DEMO_PASSWORD } from '../ui/helpers.js';

const TEST_USERS = [
  { name: 'standard_user', password: DEMO_PASSWORD, shouldSucceed: true, description: 'Standard user' },
  { name: 'locked_out_user', password: DEMO_PASSWORD, shouldSucceed: false, description: 'Locked out user' },
  { name: 'problem_user', password: DEMO_PASSWORD, shouldSucceed: true, description: 'Problem user' },
  { name: 'performance_glitch_user', password: DEMO_PASSWORD, shouldSucceed: true, description: 'Performance glitch user' },
  { name: 'error_user', password: DEMO_PASSWORD, shouldSucceed: true, description: 'Error user' },
  { name: 'visual_user', password: DEMO_PASSWORD, shouldSucceed: true, description: 'Visual user' },
];

const CHECKOUT_FIELDS = [
  { firstName: 'John', lastName: 'Doe', zip: '10001', shouldSucceed: true, description: 'Valid US address' },
  { firstName: 'Maria', lastName: 'García', zip: '28001', shouldSucceed: true, description: 'Valid Spanish address with accent' },
  { firstName: 'Jean-Pierre', lastName: 'O\'Connor', zip: '75001', shouldSucceed: true, description: 'Valid French/Irish address with apostrophe' },
  { firstName: '田中', lastName: '太郎', zip: '100-0001', shouldSucceed: true, description: 'Valid Japanese address' },
  { firstName: '', lastName: 'Doe', zip: '10001', shouldSucceed: false, description: 'Missing first name' },
  { firstName: 'John', lastName: '', zip: '10001', shouldSucceed: false, description: 'Missing last name' },
  { firstName: 'John', lastName: 'Doe', zip: '', shouldSucceed: false, description: 'Missing zip code' },
];

const PRODUCT_SORT_OPTIONS = [
  { value: 'az', description: 'Name A to Z' },
  { value: 'za', description: 'Name Z to A' },
  { value: 'lohi', description: 'Price low to high' },
  { value: 'hilo', description: 'Price high to low' },
];

test.describe('SauceDemo data-driven tests', () => {
  test.describe('Login with different user types', () => {
    for (const user of TEST_USERS) {
      test(`${user.description} (${user.name}) ${user.shouldSucceed ? 'can' : 'cannot'} sign in`, async ({ page }) => {
        await page.goto(SAUCEDEMO_URL);
        await page.getByPlaceholder('Username').fill(user.name);
        await page.getByPlaceholder('Password').fill(user.password);
        await page.getByRole('button', { name: 'Login' }).click();

        if (user.shouldSucceed) {
          await expect(page).toHaveURL(/\/inventory\.html$/);
          await expect(page.locator('[data-test="title"]')).toHaveText('Products');
        } else {
          await expect(page.locator('[data-test="error"]')).toBeVisible();
          await expect(page).toHaveURL(/\/$/);
        }
      });
    }
  });

  test.describe('Checkout with various address formats', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page);
      const firstProduct = page.locator('.inventory_item').first();
      await firstProduct.getByRole('button', { name: 'Add to cart' }).click();
      await openCart(page);
      await page.getByRole('button', { name: 'Checkout' }).click();
      await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
    });

    for (const fields of CHECKOUT_FIELDS) {
      test(`${fields.description} ${fields.shouldSucceed ? 'completes' : 'fails'}`, async ({ page }) => {
        await page.getByPlaceholder('First Name').fill(fields.firstName);
        await page.getByPlaceholder('Last Name').fill(fields.lastName);
        await page.getByPlaceholder('Zip/Postal Code').fill(fields.zip);
        await page.getByRole('button', { name: 'Continue' }).click();

        if (fields.shouldSucceed) {
          await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
          await page.goBack();
          await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
        } else {
          await expect(page.locator('[data-test="error"]')).toBeVisible();
          await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
        }
      });
    }
  });

  test.describe('Product sorting with all options', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs(page);
      await expect(page.locator('[data-test="title"]')).toHaveText('Products');
    });

    for (const sortOption of PRODUCT_SORT_OPTIONS) {
      test(`sort by ${sortOption.description}`, async ({ page }) => {
        const sortControl = page.locator('[data-test="product-sort-container"]');
        const productNames = page.locator('.inventory_item_name');
        const productPrices = page.locator('.inventory_item_price');

        await sortControl.selectOption(sortOption.value);

        if (sortOption.value === 'az') {
          const names = await productNames.allTextContents();
          expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
        } else if (sortOption.value === 'za') {
          const names = await productNames.allTextContents();
          expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
        } else if (sortOption.value === 'lohi') {
          const prices = (await productPrices.allTextContents()).map(p => Number(p.replace('$', '')));
          expect(prices).toEqual([...prices].sort((a, b) => a - b));
        } else if (sortOption.value === 'hilo') {
          const prices = (await productPrices.allTextContents()).map(p => Number(p.replace('$', '')));
          expect(prices).toEqual([...prices].sort((a, b) => b - a));
        }
      });
    }
  });

  test.describe('Multiple products in cart scenarios', () => {
    const productCounts = [1, 2, 3, 5];

    for (const count of productCounts) {
      test(`adding ${count} product(s) to cart`, async ({ page }) => {
        await loginAs(page);

        const products = page.locator('.inventory_item');
        const totalProducts = await products.count();
        const productsToAdd = Math.min(count, totalProducts);

        for (let i = 0; i < productsToAdd; i++) {
          const product = products.nth(i);
          await product.getByRole('button', { name: 'Add to cart' }).click();
        }

        await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText(String(productsToAdd), { timeout: 5000 });

        await openCart(page);
        await expect(page.locator('.cart_item')).toHaveCount(productsToAdd);
      });
    }
  });
});