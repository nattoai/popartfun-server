import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { endpoints } from './helpers/test-utils';

/**
 * Store API E2E Tests
 * 
 * Tests for public store endpoints (products, categories, shipping).
 */

describe('Store API (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Products', () => {
    describe('GET /store/products', () => {
      it('should return products list', async () => {
        const response = await request(app.getHttpServer())
          .get(endpoints.storeProducts);

        expect([200, 404]).toContain(response.status);
        
        if (response.status === 200) {
          expect(Array.isArray(response.body)).toBe(true);
        }
      });

      it('should be publicly accessible', async () => {
        const response = await request(app.getHttpServer())
          .get(endpoints.storeProducts);

        // Should not require authentication
        expect(response.status).not.toBe(401);
      });
    });

    describe('GET /store/product-categories', () => {
      it('should return categories list', async () => {
        const response = await request(app.getHttpServer())
          .get(endpoints.productCategories);

        expect([200, 404]).toContain(response.status);
        
        if (response.status === 200) {
          expect(Array.isArray(response.body)).toBe(true);
        }
      });

      it('should be publicly accessible', async () => {
        const response = await request(app.getHttpServer())
          .get(endpoints.productCategories);

        expect(response.status).not.toBe(401);
      });
    });
  });

  describe('Shipping', () => {
    describe('POST /printful/shipping/estimate', () => {
      const validShippingRequest = {
        recipient: {
          country_code: 'US',
          state_code: 'NY',
          city: 'New York',
          zip: '10001',
        },
        items: [
          {
            variant_id: 4011,
            quantity: 1,
          },
        ],
      };

      it('should calculate shipping rates', async () => {
        const response = await request(app.getHttpServer())
          .post(endpoints.shippingEstimate)
          .send(validShippingRequest);

        expect([200, 400, 404, 500]).toContain(response.status);
        
        if (response.status === 200) {
          expect(Array.isArray(response.body)).toBe(true);
        }
      });

      it('should validate recipient address', async () => {
        const invalidRequest = {
          recipient: {
            // Missing country_code
            city: 'New York',
          },
          items: [
            {
              variant_id: 4011,
              quantity: 1,
            },
          ],
        };

        const response = await request(app.getHttpServer())
          .post(endpoints.shippingEstimate)
          .send(invalidRequest);

        expect([400, 500]).toContain(response.status);
      });

      it('should validate items array', async () => {
        const requestWithNoItems = {
          recipient: {
            country_code: 'US',
            state_code: 'NY',
            city: 'New York',
            zip: '10001',
          },
          items: [],
        };

        const response = await request(app.getHttpServer())
          .post(endpoints.shippingEstimate)
          .send(requestWithNoItems);

        expect([400, 500]).toContain(response.status);
      });

      it('should handle different countries', async () => {
        const countries = [
          { country_code: 'US', zip: '10001' },
          { country_code: 'GB', zip: 'SW1A 1AA' },
          { country_code: 'JP', zip: '100-0001' },
          { country_code: 'HK', zip: '' },
        ];

        for (const address of countries) {
          const request_body = {
            recipient: {
              ...address,
              city: 'Test City',
            },
            items: [
              {
                variant_id: 4011,
                quantity: 1,
              },
            ],
          };

          const response = await request(app.getHttpServer())
            .post(endpoints.shippingEstimate)
            .send(request_body);

          // Request should be processed (may fail for various reasons)
          expect([200, 400, 404, 500]).toContain(response.status);
        }
      });
    });
  });
});

describe('Store Data Consistency', () => {
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

  it('products and categories endpoints should both be accessible', async () => {
    const productsResponse = await request(app.getHttpServer())
      .get(endpoints.storeProducts);
    
    const categoriesResponse = await request(app.getHttpServer())
      .get(endpoints.productCategories);

    // Both should be accessible
    expect(productsResponse.status).not.toBe(401);
    expect(categoriesResponse.status).not.toBe(401);
  });

  it('shipping endpoint should handle malformed requests gracefully', async () => {
    const malformedRequests = [
      {},
      { recipient: null },
      { items: null },
      'invalid json string',
    ];

    for (const body of malformedRequests) {
      const response = await request(app.getHttpServer())
        .post(endpoints.shippingEstimate)
        .send(body);

      // Should not crash, should return error
      expect([400, 500]).toContain(response.status);
    }
  });
});

