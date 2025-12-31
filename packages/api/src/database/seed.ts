import { db } from '../config/database.js';
import { users, apiKeys } from './schema.js';
import { nanoid } from 'nanoid';
import { logger } from '../shared/utils/logger.js';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    logger.info('🌱 Seeding database...');

    // Create a test user
    const testUserId = nanoid();
    const testPassword = await bcrypt.hash('password123', 10);

    await db.insert(users).values({
      id: testUserId,
      email: 'test@mik-review.ai',
      passwordHash: testPassword,
      name: 'Test User',
      plan: 'free',
      emailVerified: true,
    });

    logger.info('✅ Created test user: test@mik-review.ai');

    // Create API key for test user
    const testApiKeyValue = 'mik_' + nanoid(32);

    await db.insert(apiKeys).values({
      id: nanoid(),
      userId: testUserId,
      key: testApiKeyValue,
      name: 'Test API Key',
      isActive: true,
    });

    logger.info('✅ Created API key for test user');
    logger.info('📝 API Key: ' + testApiKeyValue);
    logger.info('📝 Email: test@mik-review.ai');
    logger.info('📝 Password: password123');

    logger.info('✅ Seed completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error(error, '❌ Seed failed');
    process.exit(1);
  }
}

seed();
