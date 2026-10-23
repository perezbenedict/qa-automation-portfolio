// @ts-check
import { test, expect } from '@playwright/test';

const API_URL = 'https://dummyjson.com';

test.describe('DummyJSON API - robust scenarios', () => {
  test.describe('Products API edge cases', () => {
    test('limit=0 returns the entire product collection', async ({ request }) => {
      const response = await request.get(`${API_URL}/products?limit=0`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      // A limit of 0 is treated as "no limit": the API echoes the total as
      // the limit and returns every product.
      expect(payload.total).toBeGreaterThan(0);
      expect(payload.limit).toBe(payload.total);
      expect(payload.products).toHaveLength(payload.total);
    });

    test('negative skip is rejected with 400 and a validation message', async ({ request }) => {
      const response = await request.get(`${API_URL}/products?skip=-1`);
      expect(response.status()).toBe(400);
      await expect(response.json()).resolves.toEqual({
        message: "Invalid 'skip' - should be a positive number",
      });
    });

    test('skip beyond the collection returns an empty page echoing the request', async ({ request }) => {
      const response = await request.get(`${API_URL}/products?skip=99999&limit=3`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload).toEqual({
        products: [],
        total: expect.any(Number),
        skip: 99999,
        limit: 0,
      });
      expect(payload.total).toBeGreaterThan(0);
    });

    test('limit larger than the collection is clamped to the total', async ({ request }) => {
      const response = await request.get(`${API_URL}/products?limit=10000`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload.total).toBeGreaterThan(0);
      expect(payload.limit).toBe(payload.total);
      expect(payload.products).toHaveLength(payload.total);
    });

    test('unknown sortBy field falls back to the natural id order', async ({ request }) => {
      const response = await request.get(`${API_URL}/products?sortBy=invalid&order=asc&limit=5`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload.products.map((product) => product.id)).toEqual([1, 2, 3, 4, 5]);
    });

    test('invalid order value is rejected with 400 and a validation message', async ({ request }) => {
      const response = await request.get(`${API_URL}/products?sortBy=title&order=invalid&limit=5`);
      expect(response.status()).toBe(400);
      await expect(response.json()).resolves.toEqual({
        message: "Invalid 'order' - should be either 'asc' or 'desc'",
      });
    });

    test('unknown category name returns an empty product list', async ({ request }) => {
      // "women's dresses" is not a real category (the real one is
      // "womens-dresses"); the encoded apostrophe still exercises URL handling.
      const response = await request.get(`${API_URL}/products/category/women's%20dresses?limit=2`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload).toEqual({
        products: [],
        total: 0,
        skip: 0,
        limit: 0,
      });
    });

    test('empty search query returns the full default page', async ({ request }) => {
      const response = await request.get(`${API_URL}/products/search?q=`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload.total).toBeGreaterThan(0);
      expect(payload.limit).toBeGreaterThan(0);
      expect(payload.products).toHaveLength(payload.limit);
    });

    test('multi-word search with no matching text returns an empty result set', async ({ request }) => {
      const response = await request.get(`${API_URL}/products/search?q=phone%20case`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload).toEqual({
        products: [],
        total: 0,
        skip: 0,
        limit: 0,
      });
    });

    test('non-numeric product id is reported as not found', async ({ request }) => {
      const response = await request.get(`${API_URL}/products/abc`);
      expect(response.status()).toBe(404);
      await expect(response.json()).resolves.toEqual({
        message: "Product with id 'abc' not found",
      });
    });

    test('product add accepts a partial payload without server-side validation', async ({ request }) => {
      const response = await request.post(`${API_URL}/products/add`, {
        data: { title: 'Test' },
      });
      expect(response.status()).toBe(201);
      const payload = await response.json();
      // The simulated add echoes whatever was submitted plus a generated id;
      // no required-field validation happens server-side.
      expect(payload).toEqual({ id: expect.any(Number), title: 'Test' });
    });

    test('patching a non-existent product returns 404 with an error message', async ({ request }) => {
      const response = await request.patch(`${API_URL}/products/999999`, {
        data: { title: 'Updated' },
      });
      expect(response.status()).toBe(404);
      await expect(response.json()).resolves.toEqual({
        message: "Product with id '999999' not found",
      });
    });

    test('simulated deletion response contains the product with isDeleted and deletedOn', async ({ request }) => {
      const response = await request.delete(`${API_URL}/products/1`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload).toEqual(expect.objectContaining({
        id: 1,
        title: expect.any(String),
        price: expect.any(Number),
        isDeleted: true,
      }));
      expect(new Date(payload.deletedOn).toISOString()).toBe(payload.deletedOn);
    });
  });

  test.describe('Users API edge cases', () => {
    test('limit=0 returns the entire user collection', async ({ request }) => {
      const response = await request.get(`${API_URL}/users?limit=0`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload.total).toBeGreaterThan(0);
      expect(payload.limit).toBe(payload.total);
      expect(payload.users).toHaveLength(payload.total);
    });

    test('search for a non-existent name returns an empty result set', async ({ request }) => {
      const response = await request.get(`${API_URL}/users/search?q=nonexistentuser12345`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload).toEqual({
        users: [],
        total: 0,
        skip: 0,
        limit: 0,
      });
    });

    test('non-numeric user id is rejected with 400 and a validation message', async ({ request }) => {
      const response = await request.get(`${API_URL}/users/abc`);
      expect(response.status()).toBe(400);
      await expect(response.json()).resolves.toEqual({
        message: "Invalid user id 'abc'",
      });
    });

    test('user record includes a well-formed email address', async ({ request }) => {
      const response = await request.get(`${API_URL}/users/1`);
      expect(response.status()).toBe(200);
      const user = await response.json();
      expect(user).toEqual(expect.objectContaining({
        id: 1,
        firstName: expect.any(String),
        lastName: expect.any(String),
      }));
      expect(user.firstName.length).toBeGreaterThan(0);
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
      expect(payload.carts.length).toBeGreaterThan(0);
      expect(payload.total).toBeGreaterThanOrEqual(payload.carts.length);

      const ids = payload.carts.map((cart) => cart.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const cart of payload.carts) {
        expect(cart).toEqual(expect.objectContaining({
          userId: expect.any(Number),
          products: expect.any(Array),
        }));
      }
    });

    test('returns cart by ID with products and consistent totals', async ({ request }) => {
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
      expect(cart.products.length).toBeGreaterThan(0);
      expect(cart.total).toBeGreaterThanOrEqual(cart.discountedTotal);
      for (const product of cart.products) {
        expect(product).toEqual(expect.objectContaining({
          title: expect.any(String),
          price: expect.any(Number),
          quantity: expect.any(Number),
        }));
        expect(product.title.length).toBeGreaterThan(0);
        expect(product.quantity).toBeGreaterThan(0);
      }
    });

    test('returns not found for unknown cart', async ({ request }) => {
      const response = await request.get(`${API_URL}/carts/999999`);
      expect(response.status()).toBe(404);
      await expect(response.json()).resolves.toEqual({
        message: "Cart with id '999999' not found",
      });
    });
  });

  test.describe('Posts API', () => {
    test('returns posts with pagination and post fields', async ({ request }) => {
      const response = await request.get(`${API_URL}/posts?limit=5`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload).toEqual(expect.objectContaining({
        limit: 5,
        skip: 0,
        total: expect.any(Number),
        posts: expect.any(Array),
      }));
      expect(payload.posts).toHaveLength(5);
      for (const post of payload.posts) {
        expect(post).toEqual(expect.objectContaining({
          id: expect.any(Number),
          title: expect.any(String),
          body: expect.any(String),
          userId: expect.any(Number),
        }));
        expect(post.title.length).toBeGreaterThan(0);
        expect(post.body.length).toBeGreaterThan(0);
      }
    });

    test('post search returns only posts whose text matches the query', async ({ request }) => {
      const response = await request.get(`${API_URL}/posts/search?q=test`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload.total).toBeGreaterThan(0);
      expect(payload.posts.length).toBe(payload.total);
      for (const post of payload.posts) {
        expect(`${post.title} ${post.body}`).toMatch(/test/i);
      }
    });
  });

  test.describe('Comments API', () => {
    test('returns comments with pagination and comment fields', async ({ request }) => {
      const response = await request.get(`${API_URL}/comments?limit=5`);
      expect(response.status()).toBe(200);
      const payload = await response.json();
      expect(payload).toEqual(expect.objectContaining({
        limit: 5,
        skip: 0,
        total: expect.any(Number),
        comments: expect.any(Array),
      }));
      expect(payload.comments).toHaveLength(5);
      for (const comment of payload.comments) {
        expect(comment).toEqual(expect.objectContaining({
          id: expect.any(Number),
          postId: expect.any(Number),
          body: expect.any(String),
          likes: expect.any(Number),
        }));
        expect(comment.body.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Quotes API', () => {
    test('returns random quote with non-empty text and author', async ({ request }) => {
      const response = await request.get(`${API_URL}/quotes/random`);
      expect(response.status()).toBe(200);
      const quote = await response.json();
      expect(quote).toEqual(expect.objectContaining({
        id: expect.any(Number),
        quote: expect.any(String),
        author: expect.any(String),
      }));
      expect(quote.quote.length).toBeGreaterThan(0);
      expect(quote.author.length).toBeGreaterThan(0);
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
      expect(payload.quotes).toHaveLength(5);
      for (const quote of payload.quotes) {
        expect(quote).toEqual(expect.objectContaining({
          id: expect.any(Number),
          quote: expect.any(String),
          author: expect.any(String),
        }));
        expect(quote.quote.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Authentication API', () => {
    test('login with valid credentials returns the user profile and tokens', async ({ request }) => {
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
        email: expect.stringMatching(/^[^@\s]+@[^@\s]+\.[^@\s]+$/),
        firstName: expect.any(String),
        lastName: expect.any(String),
        gender: expect.any(String),
        image: expect.any(String),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      }));
      expect(payload.accessToken.length).toBeGreaterThan(0);
      expect(payload.refreshToken.length).toBeGreaterThan(0);
    });

    test('login with a wrong password returns 400 with an invalid-credentials message', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth/login`, {
        data: {
          username: 'emilys',
          password: 'wrongpassword',
        },
      });
      expect(response.status()).toBe(400);
      await expect(response.json()).resolves.toEqual({
        message: 'Invalid credentials',
      });
    });

    test('login without a password returns 400 with a missing-credentials message', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth/login`, {
        data: {
          username: 'emilys',
        },
      });
      expect(response.status()).toBe(400);
      await expect(response.json()).resolves.toEqual({
        message: 'Username and password required',
      });
    });
  });
});