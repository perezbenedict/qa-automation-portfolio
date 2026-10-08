// @ts-check
import { test, expect } from '@playwright/test';
import { loginAs } from './helpers.js';

test.describe('SauceDemo product catalog', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  });

  test('sorts product names in both directions', async ({ page }) => {
    const sortControl = page.locator('[data-test="product-sort-container"]');
    const productNames = page.locator('.inventory_item_name');
    const namesInCatalog = await productNames.allTextContents();

    await test.step('sort A to Z', async () => {
      await sortControl.selectOption('az');
      await expect.poll(() => productNames.allTextContents()).toEqual(
        [...namesInCatalog].sort((a, b) => a.localeCompare(b)),
      );
    });

    await test.step('sort Z to A', async () => {
      await sortControl.selectOption('za');
      await expect.poll(() => productNames.allTextContents()).toEqual(
        [...namesInCatalog].sort((a, b) => b.localeCompare(a)),
      );
    });
  });

  test('sorts product prices from low to high and high to low', async ({ page }) => {
    const sortControl = page.locator('[data-test="product-sort-container"]');
    const productPrices = page.locator('.inventory_item_price');
    const pricesInCatalog = (await productPrices.allTextContents()).map((price) =>
      Number(price.replace('$', '')),
    );

    await test.step('sort by ascending price', async () => {
      await sortControl.selectOption('lohi');
      await expect.poll(async () =>
        (await productPrices.allTextContents()).map((price) => Number(price.replace('$', ''))),
      ).toEqual([...pricesInCatalog].sort((a, b) => a - b));
    });

    await test.step('sort by descending price', async () => {
      await sortControl.selectOption('hilo');
      await expect.poll(async () =>
        (await productPrices.allTextContents()).map((price) => Number(price.replace('$', ''))),
      ).toEqual([...pricesInCatalog].sort((a, b) => b - a));
    });
  });

  test('a product opens with its details and returns to the catalog', async ({ page }) => {
    const firstProduct = page.locator('.inventory_item').first();
    const productName = await firstProduct.locator('.inventory_item_name').innerText();

    await firstProduct.getByRole('button', { name: `View details for ${productName}` }).first().click();

    await expect(page).toHaveURL(/\/inventory-item\.html\?id=\d+$/);
    await expect(page.getByText(productName, { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Back to products' }).click();
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  });
});
