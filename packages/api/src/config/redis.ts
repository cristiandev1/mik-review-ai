import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../shared/utils/logger.js';

// Redis client for general use (cache, rate limiting, etc)
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    logger.warn(err, 'Redis connection error, attempting to reconnect...');
    return true;
  },
});

redis.on('connect', () => {
  logger.info('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  logger.error(err, '❌ Redis connection error');
});

redis.on('close', () => {
  logger.warn('⚠️  Redis connection closed');
});

// Redis client specifically for BullMQ (job queue)
export const queueRedis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // BullMQ requires this
  enableOfflineQueue: false,
});

queueRedis.on('connect', () => {
  logger.info('✅ Queue Redis connected successfully');
});

// Test Redis connection
export async function testRedisConnection() {
  try {
    await redis.ping();
    logger.info('✅ Redis connection test successful');
    return true;
  } catch (error) {
    logger.error(error, '❌ Redis connection test failed');
    return false;
  }
}
