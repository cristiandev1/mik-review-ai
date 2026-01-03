import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../../config/database.js';
import { repositories } from '../../database/schema.js';
import { logger } from '../../shared/utils/logger.js';
import type { SyncRepositoryInput, UpdateRepositoryInput } from './repository.schemas.js';

export class RepositoryService {
  /**
   * Sync a repository from GitHub to the database
   */
  async syncRepository(userId: string, data: SyncRepositoryInput) {
    try {
      // Check if repository already exists for this user
      const existing = await db
        .select()
        .from(repositories)
        .where(
          and(
            eq(repositories.userId, userId),
            eq(repositories.githubRepoId, data.githubRepoId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing repository
        const [updated] = await db
          .update(repositories)
          .set({
            fullName: data.fullName,
            name: data.name,
            owner: data.owner,
            description: data.description,
            isPrivate: data.isPrivate,
            defaultBranch: data.defaultBranch,
            language: data.language,
            updatedAt: new Date(),
          })
          .where(eq(repositories.id, existing[0].id))
          .returning();

        logger.info({ repositoryId: updated.id }, 'Repository updated');
        return updated;
      }

      // Create new repository
      const [repo] = await db
        .insert(repositories)
        .values({
          id: nanoid(),
          userId,
          githubRepoId: data.githubRepoId,
          fullName: data.fullName,
          name: data.name,
          owner: data.owner,
          description: data.description,
          isPrivate: data.isPrivate,
          isEnabled: true,
          defaultBranch: data.defaultBranch,
          language: data.language,
        })
        .returning();

      logger.info({ repositoryId: repo.id }, 'Repository synced');
      return repo;
    } catch (error: any) {
      logger.error(error, 'Failed to sync repository');
      throw new Error('Failed to sync repository');
    }
  }

  /**
   * Get all repositories for a user
   */
  async listUserRepositories(
    userId: string,
    options: { page?: number; limit?: number; isEnabled?: boolean } = {}
  ) {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;

      let query = db
        .select()
        .from(repositories)
        .where(eq(repositories.userId, userId))
        .orderBy(desc(repositories.updatedAt))
        .limit(limit)
        .offset(offset);

      // Filter by enabled status if provided
      if (options.isEnabled !== undefined) {
        query = db
          .select()
          .from(repositories)
          .where(
            and(
              eq(repositories.userId, userId),
              eq(repositories.isEnabled, options.isEnabled)
            )
          )
          .orderBy(desc(repositories.updatedAt))
          .limit(limit)
          .offset(offset);
      }

      const repos = await query;

      return {
        repositories: repos,
        total: repos.length,
        page,
        limit,
      };
    } catch (error: any) {
      logger.error(error, 'Failed to list repositories');
      throw new Error('Failed to list repositories');
    }
  }

  /**
   * Get a single repository by ID
   */
  async getRepository(id: string, userId: string) {
    try {
      const [repo] = await db
        .select()
        .from(repositories)
        .where(
          and(
            eq(repositories.id, id),
            eq(repositories.userId, userId)
          )
        )
        .limit(1);

      return repo || null;
    } catch (error: any) {
      logger.error(error, 'Failed to get repository');
      throw new Error('Failed to get repository');
    }
  }

  /**
   * Update repository (enable/disable)
   */
  async updateRepository(id: string, userId: string, data: UpdateRepositoryInput) {
    try {
      const [updated] = await db
        .update(repositories)
        .set({
          isEnabled: data.isEnabled,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(repositories.id, id),
            eq(repositories.userId, userId)
          )
        )
        .returning();

      if (!updated) {
        throw new Error('Repository not found');
      }

      logger.info({ repositoryId: id, isEnabled: data.isEnabled }, 'Repository updated');
      return updated;
    } catch (error: any) {
      logger.error(error, 'Failed to update repository');
      throw new Error('Failed to update repository');
    }
  }

  /**
   * Check if a repository is enabled for a user
   */
  async isRepositoryEnabled(userId: string, fullName: string): Promise<boolean> {
    try {
      const [repo] = await db
        .select()
        .from(repositories)
        .where(
          and(
            eq(repositories.userId, userId),
            eq(repositories.fullName, fullName),
            eq(repositories.isEnabled, true)
          )
        )
        .limit(1);

      return !!repo;
    } catch (error: any) {
      logger.error(error, 'Failed to check repository status');
      return false;
    }
  }

  /**
   * Delete a repository
   */
  async deleteRepository(id: string, userId: string) {
    try {
      await db
        .delete(repositories)
        .where(
          and(
            eq(repositories.id, id),
            eq(repositories.userId, userId)
          )
        );

      logger.info({ repositoryId: id }, 'Repository deleted');
    } catch (error: any) {
      logger.error(error, 'Failed to delete repository');
      throw new Error('Failed to delete repository');
    }
  }
}

export const repositoryService = new RepositoryService();
