/**
 * Jest E2E Test Setup
 */

// Increase timeout for E2E tests
jest.setTimeout(30000);

// Suppress console logs during tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
// };

beforeAll(async () => {
  // Any global setup before all tests
});

afterAll(async () => {
  // Any global cleanup after all tests
});

