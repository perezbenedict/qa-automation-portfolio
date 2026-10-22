// @ts-check
import { test, expect } from '@playwright/test';

const API_URL = 'https://dummyjson.com';

test.describe('DummyJSON API resilience and headers', () => {
  test('returns an application/json header and parseable body for a product', async ({ request }) => {
    const response = await request.get(`${API_URL}/products/1`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/application\/json/i);

    const payload = await response.json();
    expect(payload).toEqual(expect.objectContaining({
      id: 1,
      title: expect.any(String),
    }));
  });

  test('returns five products with unique ascending ids', async ({ request }) => {
    const response = await request.get(`${API_URL}/products?limit=5&skip=0`);

    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual(expect.objectContaining({
      limit: 5,
      skip: 0,
      products: expect.any(Array),
    }));
    expect(payload.products).toHaveLength(5);

    const ids = payload.products.map((product) => product.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBeLessThan(ids[ids.length - 1]);
  });

  test('creates a product with a unicode title and negative price', async ({ request }) => {
    const submittedTitle = '試験用商品 – café naïve ✓';
    const response = await request.post(`${API_URL}/products/add`, {
      data: { title: submittedTitle, price: -5 },
    });

    expect(response.status()).toBe(201);
    const payload = await response.json();
    expect(payload).toEqual(expect.objectContaining({
      id: expect.any(Number),
      title: submittedTitle,
      price: -5,
    }));
    expect(payload.title).toBe(submittedTitle);
  });

  test('returns only carts owned by user 1 with consistent totals', async ({ request }) => {
    const response = await request.get(`${API_URL}/carts/user/1`);

    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload.carts).toEqual(expect.any(Array));
    expect(payload.carts.length).toBeGreaterThan(0);

    for (const cart of payload.carts) {
      expect(cart).toEqual(expect.objectContaining({
        userId: 1,
        total: expect.any(Number),
        discountedTotal: expect.any(Number),
      }));
      expect(cart.userId).toBe(1);
      expect(cart.total).toBeGreaterThanOrEqual(cart.discountedTotal);
    }
  });

  test('accepts an empty PATCH body and still returns product 1', async ({ request }) => {
    const response = await request.patch(`${API_URL}/products/1`, {
      data: {},
    });

    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual(expect.objectContaining({
      id: 1,
      title: expect.any(String),
    }));
  });
});
