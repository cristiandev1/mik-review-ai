import type { FastifyInstance } from 'fastify';
import { ReviewController } from './review.controller.js';
import { apiKeyMiddleware } from '../../middleware/api-key.middleware.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { rateLimitMiddleware } from '../../middleware/rate-limit.middleware.js';

export async function reviewRoutes(app: FastifyInstance) {
  const controller = new ReviewController();

  // POST route requires API key + rate limiting (for GitHub Action)
  app.post('/', {
    preHandler: [apiKeyMiddleware, rateLimitMiddleware],
  }, controller.create.bind(controller));

  // GET routes require JWT auth (for Dashboard)
  app.get('/:id', {
    preHandler: [authMiddleware],
  }, controller.getById.bind(controller));

  app.get('/', {
    preHandler: [authMiddleware],
  }, controller.list.bind(controller));
}
