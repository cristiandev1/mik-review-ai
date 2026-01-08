import type { FastifyRequest, FastifyReply } from 'fastify';
import { repositoryService } from './repository.service.js';
import { GitHubService } from '../github/github.service.js';
import {
  syncRepositorySchema,
  updateRepositorySchema,
  listRepositoriesQuerySchema,
  type SyncRepositoryInput,
  type UpdateRepositoryInput,
  type ListRepositoriesQuery
} from './repository.schemas.js';
import { logger } from '../../shared/utils/logger.js';

export class RepositoryController {
  /**
   * GET /github/repositories - List repositories from GitHub
   */
  async listGithubRepositories(
    request: FastifyRequest<{ Querystring: { page?: string; per_page?: string } }>,
    reply: FastifyReply
  ) {
    try {
      const user = (request as any).user;

      if (!user.githubAccessToken) {
        return reply.status(400).send({
          error: 'GitHub account not connected',
          message: 'Please connect your GitHub account first',
        });
      }

      const page = parseInt(request.query.page || '1', 10);
      const perPage = parseInt(request.query.per_page || '30', 10);

      const githubService = new GitHubService(user.githubAccessToken);
      const repositories = await githubService.listUserRepositories(page, perPage);

      return reply.send({
        success: true,
        data: repositories,
        page,
        perPage,
      });
    } catch (error: any) {
      logger.error(error, 'Failed to list GitHub repositories');
      return reply.status(500).send({
        error: 'Failed to fetch repositories from GitHub',
        message: error.message,
      });
    }
  }

  /**
   * POST /repositories/sync - Sync a repository from GitHub
   */
  async syncRepository(
    request: FastifyRequest<{ Body: SyncRepositoryInput }>,
    reply: FastifyReply
  ) {
    try {
      const user = (request as any).user;
      const validatedData = syncRepositorySchema.parse(request.body);

      const repository = await repositoryService.syncRepository(user.id, validatedData);

      return reply.status(201).send({
        success: true,
        message: 'Repository synced successfully',
        data: repository,
      });
    } catch (error: any) {
      logger.error(error, 'Failed to sync repository');

      if (error.name === 'ZodError') {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: 'Failed to sync repository',
        message: error.message,
      });
    }
  }

  /**
   * GET /repositories - List synced repositories
   */
  async listRepositories(
    request: FastifyRequest<{ Querystring: ListRepositoriesQuery }>,
    reply: FastifyReply
  ) {
    try {
      const user = (request as any).user;
      const { page, limit, isEnabled } = listRepositoriesQuerySchema.parse(request.query);

      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        isEnabled: isEnabled ? isEnabled === 'true' : undefined,
      };

      const targetUserId = (request.query as any).admin_user_id || user.id;

      const result = await repositoryService.listUserRepositories(targetUserId, options);

      return reply.send({
        success: true,
        data: result.repositories,
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (error: any) {
      logger.error(error, 'Failed to list repositories');

      if (error.name === 'ZodError') {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      return reply.status(500).send({
        error: 'Failed to list repositories',
        message: error.message,
      });
    }
  }

  /**
   * GET /repositories/:id - Get a single repository
   */
  async getRepository(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const user = (request as any).user;
      const { id } = request.params;

      const repository = await repositoryService.getRepository(id, user.id);

      if (!repository) {
        return reply.status(404).send({
          success: false,
          error: 'Repository not found',
        });
      }

      return reply.send({
        success: true,
        data: repository,
      });
    } catch (error: any) {
      logger.error(error, 'Failed to get repository');
      return reply.status(500).send({
        error: 'Failed to get repository',
        message: error.message,
      });
    }
  }

  /**
   * PATCH /repositories/:id - Update repository (enable/disable)
   */
  async updateRepository(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateRepositoryInput }>,
    reply: FastifyReply
  ) {
    try {
      const user = (request as any).user;
      const { id } = request.params;
      const validatedData = updateRepositorySchema.parse(request.body);

      const repository = await repositoryService.updateRepository(id, user.id, validatedData);

      return reply.send({
        success: true,
        message: 'Repository updated successfully',
        data: repository,
      });
    } catch (error: any) {
      logger.error(error, 'Failed to update repository');

      if (error.name === 'ZodError') {
        return reply.status(400).send({
          error: 'Validation error',
          details: error.errors,
        });
      }

      if (error.message === 'Repository not found') {
        return reply.status(404).send({
          error: 'Repository not found',
        });
      }

      return reply.status(500).send({
        error: 'Failed to update repository',
        message: error.message,
      });
    }
  }

  /**
   * DELETE /repositories/:id - Delete a repository
   */
  async deleteRepository(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const user = (request as any).user;
      const { id } = request.params;

      await repositoryService.deleteRepository(id, user.id);

      return reply.send({
        success: true,
        message: 'Repository deleted successfully',
      });
    } catch (error: any) {
      logger.error(error, 'Failed to delete repository');
      return reply.status(500).send({
        error: 'Failed to delete repository',
        message: error.message,
      });
    }
  }
}

export const repositoryController = new RepositoryController();
