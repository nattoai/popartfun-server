import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import request from 'supertest';

/**
 * Test utilities for backend E2E tests
 */

export interface TestUser {
  id: string;
  email: string;
  accessToken: string;
}

/**
 * Create a test application instance
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  
  // Apply same pipes as main app
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  
  await app.init();
  return app;
}

/**
 * Get a mock JWT token for testing
 * Note: In a real test, you would use Supabase test tokens
 */
export function getMockAuthToken(userId: string = 'test-user-id'): string {
  // This is a mock token for testing purposes
  // In production tests, use actual Supabase test tokens
  return `mock_test_token_${userId}`;
}

/**
 * Create authorization header
 */
export function getAuthHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Test data helpers
 */
export const testData = {
  validShippingAddress: {
    name: 'Test User',
    address1: '123 Test Street',
    address2: 'Apt 4B',
    city: 'New York',
    state_code: 'NY',
    country_code: 'US',
    zip: '10001',
    email: 'test@example.com',
    phone: '+1-555-123-4567',
  },
  
  validOrderItem: {
    variantId: 12345,
    quantity: 1,
    productType: 'T-Shirt',
    price: '24.99',
  },
  
  validPaymentIntent: {
    amount: 2499, // $24.99 in cents
    currency: 'usd',
    metadata: {
      userId: 'test-user-id',
      cartItems: '1',
    },
  },
};

/**
 * API endpoint helpers
 */
export const endpoints = {
  // Payments
  createPaymentIntent: '/api/v1/payments/create-intent',
  getPaymentConfig: '/api/v1/payments/config',
  paymentWebhook: '/api/v1/payments/webhook',
  
  // User Products
  customProducts: '/api/v1/user-products',
  userOrders: '/api/v1/user-products/orders',
  
  // Store
  storeProducts: '/api/v1/store/products',
  productCategories: '/api/v1/store/product-categories',
  
  // Printful
  shippingEstimate: '/api/v1/printful/shipping/estimate',
  printfulCatalog: '/api/v1/printful/catalog',
};

/**
 * Make authenticated request
 */
export async function authenticatedRequest(
  app: INestApplication,
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  token: string,
  body?: any,
) {
  const req = request(app.getHttpServer())[method](url)
    .set('Authorization', `Bearer ${token}`)
    .set('Content-Type', 'application/json');
  
  if (body) {
    return req.send(body);
  }
  
  return req;
}

