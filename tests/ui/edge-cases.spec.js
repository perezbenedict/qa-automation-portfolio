// @ts-check
import { test, expect } from '@playwright/test';
import { loginAs, addFirstProductToCart, openCart, SAUCEDEMO_URL, STANDARD_USER, DEMO_PASSWORD } from './helpers.js';

test.describe('SauceDemo edge cases and boundary conditions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  });

  test('multiple products can be added and managed in cart', async ({ page }) => {
    const productNames = [];

    await test.step('add three different products', async () => {
      const products = page.locator('.inventory_item');
      const count = await products.count();
      expect(count).toBeGreaterThanOrEqual(3);

      for (let i = 0; i < 3; i++) {
        const product = products.nth(i);
        const name = await product.locator('.inventory_item_name').innerText();
        productNames.push(name);
        await product.getByRole('button', { name: 'Add to cart' }).click();
      }

      await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('3');
    });

    await test.step('verify all products in cart with correct quantities', async () => {
      await openCart(page);
      for (const name of productNames) {
        await expect(page.getByText(name, { exact: true })).toBeVisible();
        await expect(page.locator('.cart_quantity').first()).toHaveText('1');
      }
      await expect(page.locator('.cart_item')).toHaveCount(3);
    });

    await test.step('remove middle product and verify cart updates', async () => {
      const middleProduct = page.locator('.cart_item').nth(1);
      await middleProduct.getByRole('button', { name: 'Remove' }).click();
      await expect(page.locator('.cart_item')).toHaveCount(2);
      await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('2');
    });
  });

  test('sorting is stable across multiple sort changes', async ({ page }) => {
    const sortControl = page.locator('[data-test="product-sort-container"]');
    const productNames = page.locator('.inventory_item_name');

    await test.step('cycle through all sort options', async () => {
      await sortControl.selectOption('az');
      const azNames = await productNames.allTextContents();

      await sortControl.selectOption('za');
      const zaNames = await productNames.allTextContents();

      await sortControl.selectOption('lohi');
      await sortControl.selectOption('hilo');
      await sortControl.selectOption('az');
      const azNamesAgain = await productNames.allTextContents();

      expect(azNamesAgain).toEqual(azNames);
    });
  });

  test('product detail page shows complete information', async ({ page }) => {
    const firstProduct = page.locator('.inventory_item').first();
    const productName = await firstProduct.locator('.inventory_item_name').innerText();
    const productPrice = await firstProduct.locator('.inventory_item_price').innerText();
    const productDescription = await firstProduct.locator('.inventory_item_desc').innerText();

    await firstProduct.getByRole('button', { name: `View details for ${productName}` }).first().click();

    await expect(page).toHaveURL(/\/inventory-item\.html\?id=\d+$/);
    await expect(page.getByText(productName, { exact: true })).toBeVisible();
    await expect(page.locator('.inventory_details_price')).toContainText(productPrice);
    await expect(page.locator('.inventory_details_desc')).toContainText(productDescription);
  });

  test('problem_user sees product images', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);
    await loginAs(page, 'problem_user', DEMO_PASSWORD);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');

    const firstProduct = page.locator('.inventory_item').first();
    const productImage = firstProduct.locator('img.inventory_item_img');
    await expect(productImage).toBeVisible();
    const src = await productImage.getAttribute('src');
    expect(src).toBeTruthy();
  });

  test('performance_glitch_user experiences delays but functions', async ({ page }) => {
    await page.goto(SAUCEDEMO_URL);
    await loginAs(page, 'performance_glitch_user', DEMO_PASSWORD);
    // The glitch user's load delay can exceed the 5s default; capped at 10s.
    await expect(page.locator('[data-test="title"]')).toHaveText('Products', { timeout: 10000 });

    await addFirstProductToCart(page);
    await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');

    await openCart(page);
    await expect(page.locator('.cart_item')).toHaveCount(1);
  });
});