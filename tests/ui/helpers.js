export const SAUCEDEMO_URL = 'https://www.saucedemo.com';
export const STANDARD_USER = 'standard_user';
export const DEMO_PASSWORD = 'secret_sauce';

export async function loginAs(page, username = STANDARD_USER, password = DEMO_PASSWORD) {
  await page.goto(SAUCEDEMO_URL);
  await page.getByPlaceholder('Username').fill(username);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
}

export async function addFirstProductToCart(page) {
  const firstProduct = page.locator('.inventory_item').first();
  const productName = await firstProduct.locator('.inventory_item_name').innerText();
  await firstProduct.getByRole('button', { name: 'Add to cart' }).click();
  return productName;
}

export async function openCart(page) {
  await page.locator('[data-test="shopping-cart-link"]').click();
}
