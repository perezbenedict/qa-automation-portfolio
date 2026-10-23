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
      price: expect.any(Number),
      images: expect.any(Array),
    }));
    expect(payload.title.length).toBeGreaterThan(0);
    expect(payload.price).toBeGreaterThan(0);
    expect(payload.images.length).toBeGreaterThan(0);
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

  test('returns a simulated created product echoing a unicode title and negative price', async ({ request }) => {
    const submittedTitle = '試験用商品 – café naïve ✓';
    const response = await request.post(`${API_URL}/products/add`, {
      data: { title: submittedTitle, price: -5 },
    });

    expect(response.status()).toBe(201);
    const payload = await response.json();
    // The simulated add accepts the payload verbatim (no price validation)
    // and echoes it back with a generated id; nothing is persisted.
    expect(payload).toEqual({
      id: expect.any(Number),
      title: submittedTitle,
      price: -5,
    });
  });

  test('returns only carts owned by user 1 with consistent totals', async ({ request }) => {
    const response = await request.get(`${API_URL}/carts/user/1`);

    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual(expect.objectContaining({
      carts: expect.any(Array),
      total: expect.any(Number),
      skip: expect.any(Number),
      limit: expect.any(Number),
    }));
    expect(payload.carts.length).toBeGreaterThan(0);
    expect(payload.total).toBe(payload.carts.length);

    for (const cart of payload.carts) {
      expect(cart).toEqual(expect.objectContaining({
        userId: 1,
        products: expect.any(Array),
        total: expect.any(Number),
        discountedTotal: expect.any(Number),
      }));
      expect(cart.total).toBeGreaterThanOrEqual(cart.discountedTotal);
      expect(cart.products.length).toBeGreaterThan(0);
      for (const product of cart.products) {
        expect(product).toEqual(expect.objectContaining({
          title: expect.any(String),
          price: expect.any(Number),
          quantity: expect.any(Number),
        }));
        expect(product.price).toBeGreaterThan(0);
        expect(product.quantity).toBeGreaterThan(0);
      }
    }
  });

  test('empty PATCH body returns the product unchanged', async ({ request }) => {
    const response = await request.patch(`${API_URL}/products/1`, {
      data: {},
    });

    expect(response.status()).toBe(200);
    const payload = await response.json();
    // Product 1's known data is returned intact, proving the empty payload
    // did not alter any field.
    expect(payload).toEqual(expect.objectContaining({
      id: 1,
      title: 'Essence Mascara Lash Princess',
      category: 'beauty',
      price: 9.99,
      images: expect.any(Array),
    }));
    expect(payload.images.length).toBeGreaterThan(0);
  });
});
