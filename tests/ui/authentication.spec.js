// @ts-check
import { test, expect } from '@playwright/test';
import { DEMO_PASSWORD, loginAs, STANDARD_USER } from './helpers.js';

test.describe('SauceDemo authentication', () => {
  test('a valid demo user can sign in', async ({ page }) => {
    await test.step('submit valid demo credentials', async () => {
      await loginAs(page);
    });

    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  });

  test('an unknown user receives an authentication error', async ({ page }) => {
    await loginAs(page, 'unknown_user', DEMO_PASSWORD);

    await expect(page.locator('[data-test="error"]')).toContainText(
      'Username and password do not match any user in this service',
    );
    await expect(page).toHaveURL(/\/$/);
  });

  test('a valid username with an incorrect password is rejected', async ({ page }) => {
    await loginAs(page, STANDARD_USER, 'incorrect_password');

    await expect(page.locator('[data-test="error"]')).toContainText(
      'Username and password do not match any user in this service',
    );
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('a locked-out account cannot sign in', async ({ page }) => {
    await loginAs(page, 'locked_out_user', DEMO_PASSWORD);

    await expect(page.locator('[data-test="error"]')).toContainText(
      'Sorry, this user has been locked out.',
    );
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('username and password are required', async ({ page }) => {
    await page.goto('https://www.saucedemo.com');

    await test.step('validate an empty submission', async () => {
      await page.getByRole('button', { name: 'Login' }).click();
      await expect(page.locator('[data-test="error"]')).toContainText('Username is required');
    });

    await test.step('validate a missing password', async () => {
      await page.getByPlaceholder('Username').fill(STANDARD_USER);
      await page.getByRole('button', { name: 'Login' }).click();
      await expect(page.locator('[data-test="error"]')).toContainText('Password is required');
    });
  });
});
