// @ts-check
import { test, expect } from '@playwright/test';
import { addFirstProductToCart, loginAs, openCart } from './helpers.js';

async function startCheckout(page) {
  await loginAs(page);
  await addFirstProductToCart(page);
  await openCart(page);
  await page.getByRole('button', { name: 'Checkout' }).click();
  await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
}

test.describe('SauceDemo checkout', () => {
  test('a customer can complete checkout', async ({ page }) => {
    await test.step('provide customer and delivery details', async () => {
      await startCheckout(page);
      await page.getByPlaceholder('First Name').fill('Taylor');
      await page.getByPlaceholder('Last Name').fill('Morgan');
      await page.getByPlaceholder('Zip/Postal Code').fill('10001');
      await page.getByRole('button', { name: 'Continue' }).click();
    });

    await expect(page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(page.getByText('Checkout: Overview', { exact: true })).toBeVisible();
    await expect(page.locator('.cart_item')).toHaveCount(1);
    await expect(page.locator('[data-test="total-label"]')).toContainText(/^Total:/);

    await test.step('review and place the order', async () => {
      await page.getByRole('button', { name: 'Finish' }).click();
    });

    await expect(page).toHaveURL(/\/checkout-complete\.html$/);
    await expect(page.getByText('Thank you for your order!', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back Home' })).toBeVisible();
  });

  test('checkout requires a first name', async ({ page }) => {
    await startCheckout(page);
    await page.getByPlaceholder('Last Name').fill('Morgan');
    await page.getByPlaceholder('Zip/Postal Code').fill('10001');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.locator('[data-test="error"]')).toContainText('First Name is required');
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
  });

  test('checkout requires a last name', async ({ page }) => {
    await startCheckout(page);
    await page.getByPlaceholder('First Name').fill('Taylor');
    await page.getByPlaceholder('Zip/Postal Code').fill('10001');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.locator('[data-test="error"]')).toContainText('Last Name is required');
  });

  test('checkout requires a postal code', async ({ page }) => {
    await startCheckout(page);
    await page.getByPlaceholder('First Name').fill('Taylor');
    await page.getByPlaceholder('Last Name').fill('Morgan');
    await page.getByRole('button', { name: 'Continue' }).click();

    await expect(page.locator('[data-test="error"]')).toContainText('Postal Code is required');
    await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
  });
});
