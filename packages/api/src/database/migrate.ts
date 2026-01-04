import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrationClient } from '../config/database.js';
import { logger } from '../shared/utils/logger.js';
import path from 'path';
import fs from 'fs';

async function runMigrations() {
  try {
    logger.info('🔄 Running database migrations...');

    const db = drizzle(migrationClient);

    // Determine migrations folder path using process.cwd()
    // This is safer than __dirname/import.meta when mixing environments
    // We expect to run this from packages/api root
    
    // Check for dist location (Production)
    let migrationsFolder = path.join(process.cwd(), 'dist', 'database', 'migrations');
    
    if (!fs.existsSync(migrationsFolder)) {
        // Fallback to src location (Development)
        migrationsFolder = path.join(process.cwd(), 'src', 'database', 'migrations');
    }

    if (!fs.existsSync(migrationsFolder)) {
        // Last attempt: maybe we are running inside dist?
        // If process.cwd() is .../dist/database
        if (fs.existsSync(path.join(process.cwd(), 'migrations'))) {
             migrationsFolder = path.join(process.cwd(), 'migrations');
        }
    }

    logger.info(`Using migrations folder: ${migrationsFolder}`);

    if (!fs.existsSync(migrationsFolder)) {
      throw new Error(`Migrations folder not found. Searched at: ${migrationsFolder}`);
    }

    await migrate(db, {
      migrationsFolder: migrationsFolder,
    });

    logger.info('✅ Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error(error, '❌ Migration failed');
    process.exit(1);
  }
}

runMigrations();
