// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Playwright documentation quality', () => {
  test('installation page exposes clear page landmarks and heading structure', async ({ page }) => {
    await page.goto('/docs/intro');

    await expect(page).toHaveTitle(/Playwright/);
    const main = page.getByRole('main');
    await expect(main).toBeVisible();
    await expect(main.getByRole('heading', { level: 1 })).toHaveText('Installation');
    await expect(page.getByRole('navigation').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Writing tests', exact: true })).toBeVisible();

    const mainHeadingCount = await main.getByRole('heading', { level: 1 }).count();
    expect(mainHeadingCount).toBe(1);
  });

  test('keyboard activation follows a documentation link and browser history', async ({ page }) => {
    await page.goto('/docs/intro');

    const writingTestsLink = page.getByRole('link', {
      name: 'Writing tests',
      exact: true,
    });
    await writingTestsLink.focus();
    await expect(writingTestsLink).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/docs\/writing-tests\/?$/);
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText('Writing tests');

    await page.goBack();
    await expect(page).toHaveURL(/\/docs\/intro\/?$/);
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText('Installation');

    await page.goForward();
    await expect(page).toHaveURL(/\/docs\/writing-tests\/?$/);
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toHaveText('Writing tests');
  });

  test('installation content remains within a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/docs/intro');

    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1 })).toBeVisible();

    const [mainBounds, headingBounds] = await Promise.all([
      main.boundingBox(),
      main.getByRole('heading', { level: 1 }).boundingBox(),
    ]);
    expect(mainBounds).not.toBeNull();
    expect(headingBounds).not.toBeNull();
    expect(mainBounds.x).toBeGreaterThanOrEqual(0);
    expect(mainBounds.x + mainBounds.width).toBeLessThanOrEqual(375);
    expect(headingBounds.x).toBeGreaterThanOrEqual(0);
    expect(headingBounds.x + headingBounds.width).toBeLessThanOrEqual(375);
  });
});
