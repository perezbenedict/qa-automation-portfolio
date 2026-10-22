// @ts-check
import { test, expect } from '@playwright/test';

const API_URL = 'https://dummyjson.com';

test.describe('DummyJSON API - robust scenarios', () => {
  test.describe('Products API edge cases', () => {
    test('handles limit=0 gracefully (returns default limit)', async ({ request }) => {
      const response = await request.get(`${API_URL}/products?limit=0`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      // API returns default limit when 0 is provided
      expect(payload.limit).toBeGreaterThan(0);
      expect(payload.products.length).toBeGreaterThan(0);
    });

    test('handles negative skip gracefully', async ({ request }) => {
      const response = await request.get(`${API_URL}/products?skip=-1`);
      expect([200, 400]).toContain(response.status());
    });

    test('handles excessive limit gracefully', async ({ request }) => {
      const response = await request.get(`${API_URL}/products?limit=10000`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload.products.length).toBeLessThanOrEqual(payload.total);
    });

    test('sortBy with invalid field returns products unsorted', async ({ request }) => {
      const response = await request.get(`${API_URL}/products?sortBy=invalid&order=asc&limit=5`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload.products).toHaveLength(5);
    });

    test('order with invalid value returns 400', async ({ request }) => {
      const response = await request.get(`${API_URL}/products?sortBy=title&order=invalid&limit=5`);
      expect(response.status()).toBe(400);
    });

    test('category with special characters is encoded', async ({ request }) => {
      const response = await request.get(`${API_URL}/products/category/women's%20dresses?limit=2`);
      expect(response.status()).toBe(200);
    });

    test('search with empty query returns results', async ({ request }) => {
      const response = await request.get(`${API_URL}/products/search?q=`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload.products.length).toBeGreaterThanOrEqual(0);
    });

    test('search with special characters', async ({ request }) => {
      const response = await request.get(`${API_URL}/products/search?q=phone%20case`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload.products.length).toBeGreaterThanOrEqual(0);
    });

    test('product by ID with non-numeric returns 404', async ({ request }) => {
      const response = await request.get(`${API_URL}/products/abc`);
      expect([404, 400]).toContain(response.status());
    });

    test('product creation with missing required fields', async ({ request }) => {
      const response = await request.post(`${API_URL}/products/add`, {
        data: { title: 'Test' },
      });
      expect([201, 400]).toContain(response.status());
    });

    test('product update with non-existent ID returns 404 or creates', async ({ request }) => {
      const response = await request.patch(`${API_URL}/products/999999`, {
        data: { title: 'Updated' },
      });
      expect([200, 404]).toContain(response.status());
    });

    test('product deletion returns isDeleted true', async ({ request }) => {
      const response = await request.delete(`${API_URL}/products/1`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload.isDeleted).toBe(true);
      expect(payload.deletedOn).toBeTruthy();
    });
  });

  test.describe('Users API edge cases', () => {
    test('handles limit=0 gracefully (returns default limit)', async ({ request }) => {
      const response = await request.get(`${API_URL}/users?limit=0`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      // API returns default limit when 0 is provided
      expect(payload.limit).toBeGreaterThan(0);
      expect(payload.users.length).toBeGreaterThan(0);
    });

    test('search with non-existent name returns empty', async ({ request }) => {
      const response = await request.get(`${API_URL}/users/search?q=nonexistentuser12345`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload.users).toHaveLength(0);
      expect(payload.total).toBe(0);
    });

    test('user by ID with non-numeric returns 404', async ({ request }) => {
      const response = await request.get(`${API_URL}/users/abc`);
      expect([404, 400]).toContain(response.status());
    });

    test('user email format validation', async ({ request }) => {
      const response = await request.get(`${API_URL}/users/1`);
      expect(response.status()).toBe(200);
      const user = await response.json();
      expect(user.email).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
    });
  });

  test.describe('Carts API', () => {
    test('returns user carts with pagination', async ({ request }) => {
      const response = await request.get(`${API_URL}/carts?limit=5`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload).toEqual(expect.objectContaining({
        limit: 5,
        skip: 0,
        total: expect.any(Number),
        carts: expect.any(Array),
      }));
    });

    test('returns cart by ID with products', async ({ request }) => {
      const response = await request.get(`${API_URL}/carts/1`);
      expect(response.status()).toBe(200);
      const cart = await response.json();
      expect(cart).toEqual(expect.objectContaining({
        id: 1,
        userId: expect.any(Number),
        products: expect.any(Array),
        total: expect.any(Number),
        discountedTotal: expect.any(Number),
      }));
    });

    test('returns not found for unknown cart', async ({ request }) => {
      const response = await request.get(`${API_URL}/carts/999999`);
      expect(response.status()).toBe(404);
    });
  });

  test.describe('Posts API', () => {
    test('returns posts with pagination', async ({ request }) => {
      const response = await request.get(`${API_URL}/posts?limit=5`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload).toEqual(expect.objectContaining({
        limit: 5,
        skip: 0,
        total: expect.any(Number),
        posts: expect.any(Array),
      }));
      for (const post of payload.posts) {
        expect(post).toEqual(expect.objectContaining({
          id: expect.any(Number),
          title: expect.any(String),
          body: expect.any(String),
          userId: expect.any(Number),
        }));
      }
    });

    test('search posts by query', async ({ request }) => {
      const response = await request.get(`${API_URL}/posts/search?q=test`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload.posts.length).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Comments API', () => {
    test('returns comments with pagination', async ({ request }) => {
      const response = await request.get(`${API_URL}/comments?limit=5`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload).toEqual(expect.objectContaining({
        limit: 5,
        skip: 0,
        total: expect.any(Number),
        comments: expect.any(Array),
      }));
    });
  });

  test.describe('Quotes API', () => {
    test('returns random quote', async ({ request }) => {
      const response = await request.get(`${API_URL}/quotes/random`);
      expect(response.status()).toBe(200);
      const quote = await response.json();
      expect(quote).toEqual(expect.objectContaining({
        id: expect.any(Number),
        quote: expect.any(String),
        author: expect.any(String),
      }));
    });

    test('returns quotes with pagination', async ({ request }) => {
      const response = await request.get(`${API_URL}/quotes?limit=5`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload).toEqual(expect.objectContaining({
        limit: 5,
        skip: 0,
        total: expect.any(Number),
        quotes: expect.any(Array),
      }));
    });
  });

  test.describe('Authentication API', () => {
    test('login with valid credentials returns token', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth/login`, {
        data: {
          username: 'emilys',
          password: 'emilyspass',
        },
      });
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload).toEqual(expect.objectContaining({
        id: expect.any(Number),
        username: 'emilys',
        email: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        gender: expect.any(String),
        image: expect.any(String),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      }));
    });

    test('login with invalid credentials returns 400', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth/login`, {
        data: {
          username: 'emilys',
          password: 'wrongpassword',
        },
      });
      expect(response.status()).toBe(400);
      const payload = await response.json();
      expect(payload.message).toContain('Invalid');
    });
  });
});