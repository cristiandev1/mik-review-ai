import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../../config/database.js';
import { repositories, users } from '../../database/schema.js';
import { logger } from '../../shared/utils/logger.js';
import { env } from '../../config/env.js';
import { GitHubService } from '../github/github.service.js';
import type { SyncRepositoryInput, UpdateRepositoryInput } from './repository.schemas.js';

async function getGitHubServiceForUser(userId: string) {
  const [user] = await db
    .select({ githubAccessToken: users.githubAccessToken })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || !user.githubAccessToken) {
    throw new Error('User not found or not connected to GitHub');
  }

  return new GitHubService(user.githubAccessToken);
}

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

      let repoId: string;
      let isEnabled = true;

      if (existing.length > 0) {
        repoId = existing[0].id;
        isEnabled = existing[0].isEnabled; // Keep existing status

        // Update existing repository
        await db
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
          .where(eq(repositories.id, repoId));
        
        logger.info({ repositoryId: repoId }, 'Repository synced (updated)');
      } else {
        // Create new repository
        repoId = nanoid();
        isEnabled = true; // Default enabled for new sync

        await db
          .insert(repositories)
          .values({
            id: repoId,
            userId,
            githubRepoId: data.githubRepoId,
            fullName: data.fullName,
            name: data.name,
            owner: data.owner,
            description: data.description,
            isPrivate: data.isPrivate,
            isEnabled: isEnabled,
            defaultBranch: data.defaultBranch,
            language: data.language,
          });

        logger.info({ repositoryId: repoId }, 'Repository synced (created)');
      }

      // Handle Webhook
      if (isEnabled && env.GITHUB_WEBHOOK_SECRET) {
        try {
          const githubService = await getGitHubServiceForUser(userId);
          const webhookUrl = `${env.API_URL}/webhooks/github`;
          
          // We might want to check if we already have a webhook ID recorded
          // But for now, let's try to create one if we don't have it or just ensure it exists.
          // Since we don't easily know if the webhook exists on GitHub side without checking,
          // we might just try to create it. If it fails (already exists), we catch it.
          // Ideally we store the ID.
          
          const [currentRepo] = await db
            .select()
            .from(repositories)
            .where(eq(repositories.id, repoId))
            .limit(1);

          if (!currentRepo.githubWebhookId) {
             const webhookId = await githubService.createWebhook(
               data.owner,
               data.name,
               webhookUrl,
               env.GITHUB_WEBHOOK_SECRET
             );

             await db
               .update(repositories)
               .set({ githubWebhookId: webhookId })
               .where(eq(repositories.id, repoId));
             
             logger.info({ repositoryId: repoId, webhookId }, 'Webhook created for repository');
          }
        } catch (webhookError) {
          logger.warn({ err: webhookError, repositoryId: repoId }, 'Failed to setup webhook during sync');
          // Don't fail the sync process just because webhook failed
        }
      }

      const [finalRepo] = await db
        .select()
        .from(repositories)
        .where(eq(repositories.id, repoId))
        .limit(1);
        
      return finalRepo;
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

      if (!repo) {
        throw new Error('Repository not found');
      }

      // Update in DB
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.isEnabled !== undefined) {
        updateData.isEnabled = data.isEnabled;
      }

      if (data.allowedUsernames !== undefined) {
        updateData.allowedUsernames = data.allowedUsernames;
      }

      if (data.excludedFilePatterns !== undefined) {
        updateData.excludedFilePatterns = data.excludedFilePatterns;
      }

      const [updated] = await db
        .update(repositories)
        .set(updateData)
        .where(eq(repositories.id, id))
        .returning();

      // Handle Webhook changes
      if (data.isEnabled !== undefined && data.isEnabled !== repo.isEnabled && env.GITHUB_WEBHOOK_SECRET) {
        try {
          const githubService = await getGitHubServiceForUser(userId);
          const webhookUrl = `${env.API_URL}/webhooks/github`;

          if (data.isEnabled) {
            // Enable -> Create Webhook if not exists
            if (!repo.githubWebhookId) {
               const webhookId = await githubService.createWebhook(
                 repo.owner,
                 repo.name,
                 webhookUrl,
                 env.GITHUB_WEBHOOK_SECRET
               );
               
               await db
                 .update(repositories)
                 .set({ githubWebhookId: webhookId })
                 .where(eq(repositories.id, id));
                 
               logger.info({ repositoryId: id, webhookId }, 'Webhook created (enabled)');
            }
          } else {
            // Disable -> Delete Webhook if exists
            if (repo.githubWebhookId) {
              await githubService.deleteWebhook(
                repo.owner,
                repo.name,
                repo.githubWebhookId
              );

              await db
                 .update(repositories)
                 .set({ githubWebhookId: null })
                 .where(eq(repositories.id, id));

              logger.info({ repositoryId: id }, 'Webhook deleted (disabled)');
            }
          }
        } catch (webhookError) {
          logger.warn({ err: webhookError, repositoryId: id }, 'Failed to update webhook status');
          // Don't fail the operation
        }
      }

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

      if (repo) {
         // Delete Webhook if exists
         if (repo.githubWebhookId && env.GITHUB_WEBHOOK_SECRET) {
           try {
             const githubService = await getGitHubServiceForUser(userId);
             await githubService.deleteWebhook(
               repo.owner,
               repo.name,
               repo.githubWebhookId
             );
           } catch (webhookError) {
             logger.warn({ err: webhookError, repositoryId: id }, 'Failed to delete webhook during repo deletion');
           }
         }

        await db
          .delete(repositories)
          .where(eq(repositories.id, id));

        logger.info({ repositoryId: id }, 'Repository deleted');
      }
    } catch (error: any) {
      logger.error(error, 'Failed to delete repository');
      throw new Error('Failed to delete repository');
    }
  }
}

export const repositoryService = new RepositoryService();
