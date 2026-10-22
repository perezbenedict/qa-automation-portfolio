// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Test data generators and utilities for robust test scenarios
 */

export const TEST_USERS = {
  standard: { username: 'standard_user', password: 'secret_sauce', locked: false },
  lockedOut: { username: 'locked_out_user', password: 'secret_sauce', locked: true },
  problem: { username: 'problem_user', password: 'secret_sauce', locked: false },
  performanceGlitch: { username: 'performance_glitch_user', password: 'secret_sauce', locked: false },
  errorUser: { username: 'error_user', password: 'secret_sauce', locked: false },
  visualUser: { username: 'visual_user', password: 'secret_sauce', locked: false },
};

export const CHECKOUT_TEST_DATA = {
  valid: [
    { firstName: 'John', lastName: 'Doe', zip: '10001' },
    { firstName: 'Jane', lastName: 'Smith', zip: '90210' },
    { firstName: "O'Connor", lastName: 'Smith-Jones', zip: '10001-1234' },
    { firstName: 'Maria', lastName: 'García', zip: '28001' },
    { firstName: 'Jean-Pierre', lastName: 'Dubois', zip: '75001' },
  ],
  invalid: [
    { firstName: '', lastName: 'Doe', zip: '10001', error: 'First Name is required' },
    { firstName: 'John', lastName: '', zip: '10001', error: 'Last Name is required' },
    { firstName: 'John', lastName: 'Doe', zip: '', error: 'Postal Code is required' },
  ],
  edgeCases: [
    { firstName: 'A', lastName: 'B', zip: '1' },
    { firstName: 'VeryLongFirstNameThatExceedsNormalLength', lastName: 'VeryLongLastNameThatExceedsNormalLength', zip: '1234567890' },
    { firstName: '<script>alert(1)</script>', lastName: 'Doe', zip: '10001' },
    { firstName: 'John', lastName: 'Doe', zip: 'abcde' },
  ],
};

export const PRODUCT_SORT_OPTIONS = [
  { value: 'az', label: 'Name (A to Z)', compare: (a, b) => a.localeCompare(b) },
  { value: 'za', label: 'Name (Z to A)', compare: (a, b) => b.localeCompare(a) },
  { value: 'lohi', label: 'Price (low to high)', compare: (a, b) => a - b },
  { value: 'hilo', label: 'Price (high to low)', compare: (a, b) => b - a },
];

export function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateRandomEmail() {
  return `${generateRandomString(8)}@example.com`;
}

export function generateRandomPhone() {
  return `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
}

export async function measureTime(fn) {
  const start = Date.now();
  const result = await fn();
  return { result, duration: Date.now() - start };
}

export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 100) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, i)));
    }
  }
  throw lastError;
}

export function getUniqueTestName(prefix = 'test') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const VIEWPORTS = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  largeDesktop: { width: 1920, height: 1080 },
};

export async function waitForNetworkIdle(page, timeout = 500) {
  await page.waitForLoadState('networkidle', { timeout });
}

export async function takeScreenshot(page, name, options = {}) {
  return await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true, ...options });
}

export function assertNoConsoleErrors(page) {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  return () => {
    expect(errors).toHaveLength(0);
  };
}

export const API_ENDPOINTS = {
  dummyjson: {
    base: 'https://dummyjson.com',
    products: '/products',
    users: '/users',
    carts: '/carts',
    posts: '/posts',
    comments: '/comments',
    quotes: '/quotes',
    auth: '/auth/login',
  },
};

export function validateProductSchema(product) {
  expect(product).toEqual(expect.objectContaining({
    id: expect.any(Number),
    title: expect.any(String),
    price: expect.any(Number),
    description: expect.any(String),
    category: expect.any(String),
    images: expect.any(Array),
    rating: expect.any(Number),
  }));
  expect(product.title.length).toBeGreaterThan(0);
  expect(product.price).toBeGreaterThan(0);
  expect(product.images.length).toBeGreaterThan(0);
}

export function validateUserSchema(user) {
  expect(user).toEqual(expect.objectContaining({
    id: expect.any(Number),
    firstName: expect.any(String),
    lastName: expect.any(String),
    email: expect.stringMatching(/^[^@\s]+@[^@\s]+\.[^@\s]+$/),
    username: expect.any(String),
    phone: expect.any(String),
  }));
}

export function validateCartSchema(cart) {
  expect(cart).toEqual(expect.objectContaining({
    id: expect.any(Number),
    userId: expect.any(Number),
    products: expect.any(Array),
    total: expect.any(Number),
    discountedTotal: expect.any(Number),
    totalProducts: expect.any(Number),
    totalQuantity: expect.any(Number),
  }));
}

export function validatePaginatedResponse(response, expectedLimit) {
  expect(response).toEqual(expect.objectContaining({
    limit: expectedLimit,
    skip: expect.any(Number),
    total: expect.any(Number),
  }));
}