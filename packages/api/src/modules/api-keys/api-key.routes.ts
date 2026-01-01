import type { FastifyInstance } from 'fastify';
import { ApiKeyController } from './api-key.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

export async function apiKeyRoutes(app: FastifyInstance) {
  const controller = new ApiKeyController();

  // All API key routes require authentication
  app.post('/', {
    preHandler: [authMiddleware],
  }, controller.create.bind(controller));

  app.get('/', {
    preHandler: [authMiddleware],
  }, controller.list.bind(controller));

  app.delete('/:id', {
    preHandler: [authMiddleware],
  }, controller.revoke.bind(controller));
}
