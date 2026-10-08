// @ts-check
import { test, expect } from '@playwright/test';

test('homepage identifies Playwright and exposes documentation navigation', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Playwright/);
  await expect(page.getByRole('banner').getByRole('heading', { level: 1 })).toContainText(/Playwright/);
  await expect(
    page.getByRole('navigation').getByRole('link', { name: 'Docs', exact: true }),
  ).toBeVisible();
});

test('Get started opens the installation guide', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Get started', exact: true }).click();

  await expect(page).toHaveURL(/\/docs\/intro\/?$/);
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText('Installation');
});

test('installation guide presents the Playwright setup command', async ({ page }) => {
  await page.goto('/docs/intro');

  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Installation');
  await expect(main).toContainText(/npm init playwright@latest/);
});

test('readers can navigate from installation to writing tests', async ({ page }) => {
  await page.goto('/docs/intro');

  await page.getByRole('link', { name: 'Writing tests', exact: true }).click();

  await expect(page).toHaveURL(/\/docs\/writing-tests\/?$/);
  await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText('Writing tests');
});
