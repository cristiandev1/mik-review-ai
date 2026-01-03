import { beforeAll, afterAll, vi } from 'vitest';
import * as dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-min-32-chars-long';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/mik_review_ai_test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';

// Global test setup
beforeAll(async () => {
  // Setup code before all tests
});

// Global test teardown
afterAll(async () => {
  // Cleanup code after all tests
});

// Mock logger to avoid console spam during tests
vi.mock('../src/shared/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock Redis to avoid connection errors in integration tests
vi.mock('../src/config/redis.js', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
    exists: vi.fn(),
    disconnect: vi.fn(),
    defineCommand: vi.fn(), // Required by @fastify/rate-limit
  },
  queueRedis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    disconnect: vi.fn(),
  },
}));
