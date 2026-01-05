import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from './env.js';
import { logger } from '../shared/utils/logger.js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';
import fs from 'fs';

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

// Auto-migrate on startup (fallback if preDeployCommand fails)
export async function runMigrationsOnStartup() {
  try {
    logger.info('🔄 Checking for pending migrations...');

    const drizzleDb = drizzle(migrationClient);

    // Determine migrations folder path
    let migrationsFolder = path.join(process.cwd(), 'dist', 'database', 'migrations');

    if (!fs.existsSync(migrationsFolder)) {
      migrationsFolder = path.join(process.cwd(), 'src', 'database', 'migrations');
    }

    if (!fs.existsSync(migrationsFolder)) {
      if (fs.existsSync(path.join(process.cwd(), 'migrations'))) {
        migrationsFolder = path.join(process.cwd(), 'migrations');
      }
    }

    if (!fs.existsSync(migrationsFolder)) {
      logger.warn('⚠️ Migrations folder not found, skipping auto-migration');
      return;
    }

    await migrate(drizzleDb, {
      migrationsFolder: migrationsFolder,
    });

    logger.info('✅ Migrations completed successfully');
  } catch (error) {
    logger.error(error, '⚠️ Auto-migration failed (this is not critical if migrations were already applied)');
    // Don't throw - let the app continue if migrations are already applied
  }
}
