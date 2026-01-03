import type { FastifyInstance } from 'fastify';
import { repositoryController } from './repository.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

export async function repositoryRoutes(app: FastifyInstance) {
  // Get repositories from GitHub (requires GitHub token)
  app.get('/github/repositories', {
    preHandler: [authMiddleware],
  }, repositoryController.listGithubRepositories.bind(repositoryController));

  // Sync a repository from GitHub to database
  app.post('/repositories/sync', {
    preHandler: [authMiddleware],
  }, repositoryController.syncRepository.bind(repositoryController));

  // List synced repositories
  app.get('/repositories', {
    preHandler: [authMiddleware],
  }, repositoryController.listRepositories.bind(repositoryController));

  // Get single repository
  app.get('/repositories/:id', {
    preHandler: [authMiddleware],
  }, repositoryController.getRepository.bind(repositoryController));

  // Update repository (enable/disable)
  app.patch('/repositories/:id', {
    preHandler: [authMiddleware],
  }, repositoryController.updateRepository.bind(repositoryController));

  // Delete repository
  app.delete('/repositories/:id', {
    preHandler: [authMiddleware],
  }, repositoryController.deleteRepository.bind(repositoryController));
}
