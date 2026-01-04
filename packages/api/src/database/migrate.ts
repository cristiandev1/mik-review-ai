import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrationClient } from '../config/database.js';
import { logger } from '../shared/utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    logger.info('🔄 Running database migrations...');

    const db = drizzle(migrationClient);

    // Determine migrations folder path
    // In dev: src/database/migrations
    // In prod: dist/database/migrations
    let migrationsFolder = path.join(__dirname, 'migrations');
    
    // Fallback or verify
    if (!fs.existsSync(migrationsFolder)) {
        // Try looking in src if we are in dev but somehow path is different, 
        // or up one level if structure is different. 
        // But with standard compilation, __dirname in dist/database should see migrations sibling.
        logger.warn(`Migrations folder not found at ${migrationsFolder}, checking alternative locations...`);
        const srcPath = path.join(process.cwd(), 'src', 'database', 'migrations');
        if (fs.existsSync(srcPath)) {
            migrationsFolder = srcPath;
        }
    }

    logger.info(`Using migrations folder: ${migrationsFolder}`);

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
