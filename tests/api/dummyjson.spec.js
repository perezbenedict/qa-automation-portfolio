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

  test('returns distinct product pages and echoes pagination parameters', async ({ request }) => {
    const pageSize = 3;
    const firstResponse = await request.get(`${API_URL}/products?limit=${pageSize}&skip=0`);

    expect(firstResponse.status()).toBe(200);
    const firstPage = await firstResponse.json();
    expect(firstPage).toEqual(expect.objectContaining({
      limit: pageSize,
      skip: 0,
      total: expect.any(Number),
      products: expect.any(Array),
    }));
    expect(firstPage.products.length).toBeGreaterThan(0);

    if (firstPage.total > firstPage.products.length) {
      const nextSkip = firstPage.products.length;
      const nextResponse = await request.get(
        `${API_URL}/products?limit=${pageSize}&skip=${nextSkip}`,
      );

      expect(nextResponse.status()).toBe(200);
      const nextPage = await nextResponse.json();
      expect(nextPage).toEqual(expect.objectContaining({
        limit: pageSize,
        skip: nextSkip,
        total: firstPage.total,
        products: expect.any(Array),
      }));
      expect(nextPage.products.length).toBeGreaterThan(0);
      expect(nextPage.products.map((product) => product.id))
        .not.toEqual(firstPage.products.map((product) => product.id));
    }
  });

  test('sorts products by title in the requested order', async ({ request }) => {
    const response = await request.get(
      `${API_URL}/products?sortBy=title&order=asc&limit=10`,
    );

    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual(expect.objectContaining({
      limit: 10,
      skip: 0,
      products: expect.any(Array),
    }));
    expect(payload.products.length).toBeGreaterThan(0);

    const titles = payload.products.map((product) => product.title.toLowerCase());
    expect(titles).toEqual([...titles].sort((left, right) => left.localeCompare(right)));
  });

  test('lists product categories and filters products by a returned category', async ({ request }) => {
    const categoriesResponse = await request.get(`${API_URL}/products/category-list`);

    expect(categoriesResponse.status()).toBe(200);
    const categories = await categoriesResponse.json();
    expect(categories).toEqual(expect.arrayContaining([expect.any(String)]));

    const category = categories[0];
    const productsResponse = await request.get(
      `${API_URL}/products/category/${encodeURIComponent(category)}?limit=5`,
    );

    expect(productsResponse.status()).toBe(200);
    const payload = await productsResponse.json();
    expect(payload).toEqual(expect.objectContaining({
      products: expect.any(Array),
      total: expect.any(Number),
      skip: expect.any(Number),
      limit: 5,
    }));
    expect(payload.products.length).toBeGreaterThan(0);
    for (const product of payload.products) {
      expect(product.category).toBe(category);
    }
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

  test('returns distinct user pages and echoes pagination parameters', async ({ request }) => {
    const pageSize = 3;
    const firstResponse = await request.get(`${API_URL}/users?limit=${pageSize}&skip=0`);

    expect(firstResponse.status()).toBe(200);
    const firstPage = await firstResponse.json();
    expect(firstPage).toEqual(expect.objectContaining({
      limit: pageSize,
      skip: 0,
      total: expect.any(Number),
      users: expect.any(Array),
    }));
    expect(firstPage.users.length).toBeGreaterThan(0);

    if (firstPage.total > firstPage.users.length) {
      const nextSkip = firstPage.users.length;
      const nextResponse = await request.get(
        `${API_URL}/users?limit=${pageSize}&skip=${nextSkip}`,
      );

      expect(nextResponse.status()).toBe(200);
      const nextPage = await nextResponse.json();
      expect(nextPage).toEqual(expect.objectContaining({
        limit: pageSize,
        skip: nextSkip,
        total: firstPage.total,
        users: expect.any(Array),
      }));
      expect(nextPage.users.length).toBeGreaterThan(0);
      expect(nextPage.users.map((user) => user.id))
        .not.toEqual(firstPage.users.map((user) => user.id));
    }
  });

  test('searches users using a name obtained from the user collection', async ({ request }) => {
    const collectionResponse = await request.get(`${API_URL}/users?limit=1`);

    expect(collectionResponse.status()).toBe(200);
    const collection = await collectionResponse.json();
    expect(collection.users).toEqual(expect.arrayContaining([
      expect.objectContaining({ firstName: expect.any(String) }),
    ]));
    const query = collection.users[0].firstName;

    const response = await request.get(
      `${API_URL}/users/search?q=${encodeURIComponent(query)}`,
    );

    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result).toEqual(expect.objectContaining({
      users: expect.any(Array),
      total: expect.any(Number),
      skip: expect.any(Number),
      limit: expect.any(Number),
    }));
    expect(result.users.length).toBeGreaterThan(0);
    expect(result.users.some((user) => (
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(query.toLowerCase())
    ))).toBe(true);
  });

  test('returns a not-found response for an unknown user ID', async ({ request }) => {
    const response = await request.get(`${API_URL}/users/999999`);

    expect(response.status()).toBe(404);
    await expect(response.json()).resolves.toEqual(expect.objectContaining({
      message: expect.stringMatching(/not found/i),
    }));
  });
});
