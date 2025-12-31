import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from './env.js';
import { logger } from '../shared/utils/logger.js';

// Connection for queries
const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {}, // Suppress notices
});

// Database instance
export const db = drizzle(queryClient, {
  logger: env.NODE_ENV === 'development',
});

// Connection for migrations
export const migrationClient = postgres(env.DATABASE_URL, { max: 1 });

// Test database connection
export async function testDatabaseConnection() {
  try {
    await queryClient`SELECT 1`;
    logger.info('✅ Database connection successful');
    return true;
  } catch (error) {
    logger.error(error, '❌ Database connection failed');
    return false;
  }
}
