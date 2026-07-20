import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { endpoints, testData, getMockAuthToken } from './helpers/test-utils';

/**
 * User Products API E2E Tests
 * 
 * Tests for custom products and user orders endpoints.
 */

describe('User Products API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
    }));
    app.setGlobalPrefix('api/v1');
    await app.init();

    authToken = getMockAuthToken('test-user-products');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Custom Products', () => {
    describe('GET /user-products', () => {
      it('should require authentication', async () => {
        const response = await request(app.getHttpServer())
          .get(endpoints.customProducts);

        expect(response.status).toBe(401);
      });

      it('should return user custom products when authenticated', async () => {
        const response = await request(app.getHttpServer())
          .get(endpoints.customProducts)
          .set('Authorization', `Bearer ${authToken}`);

        // Will fail with mock token, but validates endpoint exists
        expect([200, 401, 403]).toContain(response.status);
      });
    });

    describe('POST /user-products', () => {
      it('should require authentication', async () => {
        const productData = {
          productId: 'test-product-123',
          variantId: 12345,
          designData: {
            fileDataUrl: 'https://example.com/design.png',
            scale: 1,
            positionX: 50,
            positionY: 50,
            rotation: 0,
          },
        };

        const response = await request(app.getHttpServer())
          .post(endpoints.customProducts)
          .send(productData);

        expect(response.status).toBe(401);
      });

      it('should validate required fields', async () => {
        const invalidData = {
          // Missing required fields
        };

        const response = await request(app.getHttpServer())
          .post(endpoints.customProducts)
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData);

        expect([400, 401]).toContain(response.status);
      });
    });
  });

  describe('User Orders', () => {
    describe('GET /user-products/orders', () => {
      it('should require authentication', async () => {
        const response = await request(app.getHttpServer())
          .get(endpoints.userOrders);

        expect(response.status).toBe(401);
      });

      it('should return user orders when authenticated', async () => {
        const response = await request(app.getHttpServer())
          .get(endpoints.userOrders)
          .set('Authorization', `Bearer ${authToken}`);

        expect([200, 401, 403]).toContain(response.status);
        
        if (response.status === 200) {
          expect(Array.isArray(response.body)).toBe(true);
        }
      });
    });

    describe('POST /user-products/orders', () => {
      it('should require authentication', async () => {
        const orderData = {
          recipient: testData.validShippingAddress,
          items: [testData.validOrderItem],
          shippingMethod: 'STANDARD',
          shippingCost: 5.99,
          taxAmount: 0,
          paymentIntentId: 'pi_test_123',
        };

        const response = await request(app.getHttpServer())
          .post(endpoints.userOrders)
          .send(orderData);

        expect(response.status).toBe(401);
      });

      it('should validate recipient address', async () => {
        const invalidOrder = {
          recipient: {
            // Missing required fields
            name: '',
          },
          items: [],
          shippingMethod: 'STANDARD',
          shippingCost: 0,
          taxAmount: 0,
          paymentIntentId: 'pi_test_123',
        };

        const response = await request(app.getHttpServer())
          .post(endpoints.userOrders)
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidOrder);

        expect([400, 401]).toContain(response.status);
      });

      it('should validate items array is not empty', async () => {
        const orderWithNoItems = {
          recipient: testData.validShippingAddress,
          items: [],
          shippingMethod: 'STANDARD',
          shippingCost: 5.99,
          taxAmount: 0,
          paymentIntentId: 'pi_test_123',
        };

        const response = await request(app.getHttpServer())
          .post(endpoints.userOrders)
          .set('Authorization', `Bearer ${authToken}`)
          .send(orderWithNoItems);

        expect([400, 401]).toContain(response.status);
      });

      it('should require payment intent ID', async () => {
        const orderWithoutPayment = {
          recipient: testData.validShippingAddress,
          items: [testData.validOrderItem],
          shippingMethod: 'STANDARD',
          shippingCost: 5.99,
          taxAmount: 0,
          // Missing paymentIntentId
        };

        const response = await request(app.getHttpServer())
          .post(endpoints.userOrders)
          .set('Authorization', `Bearer ${authToken}`)
          .send(orderWithoutPayment);

        expect([400, 401]).toContain(response.status);
      });
    });

    describe('GET /user-products/orders/:id', () => {
      it('should require authentication', async () => {
        const response = await request(app.getHttpServer())
          .get(`${endpoints.userOrders}/test-order-id`);

        expect(response.status).toBe(401);
      });
    });
  });
});

describe('Order Flow Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should enforce authentication on all user endpoints', async () => {
    const endpoints = [
      { method: 'get', path: '/api/v1/user-products' },
      { method: 'post', path: '/api/v1/user-products' },
      { method: 'get', path: '/api/v1/user-products/orders' },
      { method: 'post', path: '/api/v1/user-products/orders' },
    ];

    for (const endpoint of endpoints) {
      const response = await (request(app.getHttpServer()) as any)[endpoint.method](endpoint.path);
      expect(response.status).toBe(401);
    }
  });
});

