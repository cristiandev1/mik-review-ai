import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrationClient } from '../config/database.js';
import { logger } from '../shared/utils/logger.js';

async function runMigrations() {
  try {
    logger.info('🔄 Running database migrations...');

    const db = drizzle(migrationClient);

    await migrate(db, {
      migrationsFolder: './src/database/migrations',
    });

    logger.info('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error(error, '❌ Migration failed');
    process.exit(1);
  }
}

runMigrations();
