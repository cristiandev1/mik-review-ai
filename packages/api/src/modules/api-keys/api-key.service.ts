import { db } from '../../config/database.js';
import { apiKeys, users } from '../../database/schema.js';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { CreateApiKeyInput } from './api-key.schemas.js';

export class ApiKeyService {
  async create(userId: string, input: CreateApiKeyInput) {
    const keyValue = 'mik_' + nanoid(32);

    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        id: nanoid(),
        userId,
        key: keyValue,
        name: input.name,
        isActive: true,
      })
      .returning();

    return {
      id: apiKey.id,
      name: apiKey.name,
      key: keyValue, // Only returned on creation
      createdAt: apiKey.createdAt,
    };
  }

  async list(userId: string) {
    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        isActive: apiKeys.isActive,
        lastUsedAt: apiKeys.lastUsedAt,
        createdAt: apiKeys.createdAt,
        // key is NOT returned for security
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(apiKeys.createdAt);

    return keys;
  }

  async revoke(userId: string, keyId: string) {
    const [deleted] = await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)))
      .returning();

    if (!deleted) {
      throw new Error('API key not found');
    }

    return { success: true };
  }

  async validateApiKey(key: string) {
    const [result] = await db
      .select({
        userId: users.id,
        userEmail: users.email,
        userName: users.name,
        userPlan: users.plan,
        keyId: apiKeys.id,
        keyName: apiKeys.name,
      })
      .from(apiKeys)
      .innerJoin(users, eq(apiKeys.userId, users.id))
      .where(and(eq(apiKeys.key, key), eq(apiKeys.isActive, true)))
      .limit(1);

    if (!result) {
      throw new Error('Invalid API key');
    }

    // Update last used timestamp
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, result.keyId));

    return {
      userId: result.userId,
      userEmail: result.userEmail,
      userName: result.userName,
      userPlan: result.userPlan,
      keyId: result.keyId,
      keyName: result.keyName,
    };
  }
}
