// @ts-check
import { test, expect } from '@playwright/test';

const API_URL = 'https://dummyjson.com';

test.describe('DummyJSON products API', () => {
  test('lists products with pagination metadata and product fields', async ({ request }) => {
    const response = await request.get(`${API_URL}/products?limit=10`);

    await test.step('returns a successful JSON response', async () => {
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toMatch(/application\/json/i);
    });

    const payload = await response.json();
    await test.step('exposes a paginated product collection', async () => {
      expect(payload).toMatchObject({ limit: 10, skip: 0 });
      expect(payload.total).toBeGreaterThanOrEqual(10);
      expect(payload.products).toHaveLength(10);

      for (const product of payload.products) {
        expect(product).toEqual(expect.objectContaining({
          id: expect.any(Number),
          title: expect.any(String),
          price: expect.any(Number),
          images: expect.any(Array),
        }));
        expect(product.title.length).toBeGreaterThan(0);
        expect(product.price).toBeGreaterThan(0);
      }
    });
  });

  test('returns a product by ID with its detail fields', async ({ request }) => {
    const response = await request.get(`${API_URL}/products/1`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/application\/json/i);

    const product = await response.json();
    expect(product).toEqual(expect.objectContaining({
      id: 1,
      title: expect.any(String),
      description: expect.any(String),
      category: expect.any(String),
      rating: expect.any(Number),
      images: expect.any(Array),
    }));
    expect(product.title.length).toBeGreaterThan(0);
    expect(product.images.length).toBeGreaterThan(0);
  });

  test('searches products using the supplied query', async ({ request }) => {
    const response = await request.get(`${API_URL}/products/search?q=phone`);

    expect(response.status()).toBe(200);
    const result = await response.json();

    expect(result.products.length).toBeGreaterThan(0);
    expect(
      result.products.some((product) => /phone/i.test(`${product.title} ${product.description}`)),
    ).toBe(true);
  });

  test('returns a not-found response for an unknown product ID', async ({ request }) => {
    const response = await request.get(`${API_URL}/products/999999`);

    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toMatch(/application\/json/i);
    await expect(response.json()).resolves.toEqual(expect.objectContaining({
      message: expect.stringMatching(/not found/i),
    }));
  });

  test('creates a product and echoes the submitted fields', async ({ request }) => {
    const newProduct = {
      title: 'Playwright portfolio API test product',
      price: 19.99,
      category: 'beauty',
    };
    const response = await request.post(`${API_URL}/products/add`, {
      data: newProduct,
    });

    expect(response.status()).toBe(201);
    expect(response.headers()['content-type']).toMatch(/application\/json/i);
    expect(await response.json()).toEqual(expect.objectContaining({
      id: expect.any(Number),
      ...newProduct,
    }));
  });

  test('updates a product using a partial payload', async ({ request }) => {
    const changes = { title: 'Updated by the Playwright portfolio suite' };
    const response = await request.patch(`${API_URL}/products/1`, {
      data: changes,
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({
      id: 1,
      ...changes,
    }));
  });

  test('reports a simulated product deletion', async ({ request }) => {
    const response = await request.delete(`${API_URL}/products/1`);

    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({
      id: 1,
      isDeleted: true,
      deletedOn: expect.any(String),
    }));
  });
});

test.describe('DummyJSON users API', () => {
  test('returns a user record with contact and identity fields', async ({ request }) => {
    const response = await request.get(`${API_URL}/users/1`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/application\/json/i);

    const user = await response.json();
    expect(user).toEqual(expect.objectContaining({
      id: 1,
      firstName: expect.any(String),
      lastName: expect.any(String),
      email: expect.stringMatching(/^[^@\s]+@[^@\s]+\.[^@\s]+$/),
    }));
  });

  test('returns a not-found response for an unknown user ID', async ({ request }) => {
    const response = await request.get(`${API_URL}/users/999999`);

    expect(response.status()).toBe(404);
    await expect(response.json()).resolves.toEqual(expect.objectContaining({
      message: expect.stringMatching(/not found/i),
    }));
  });
});
