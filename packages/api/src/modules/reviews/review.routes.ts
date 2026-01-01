import type { FastifyInstance } from 'fastify';
import { ReviewController } from './review.controller.js';
import { apiKeyMiddleware } from '../../middleware/api-key.middleware.js';
import { rateLimitMiddleware } from '../../middleware/rate-limit.middleware.js';

export async function reviewRoutes(app: FastifyInstance) {
  const controller = new ReviewController();

  // POST route requires API key + rate limiting
  app.post('/', {
    preHandler: [apiKeyMiddleware, rateLimitMiddleware],
  }, controller.create.bind(controller));

  app.get('/:id', {
    preHandler: [apiKeyMiddleware],
  }, controller.getById.bind(controller));

  app.get('/', {
    preHandler: [apiKeyMiddleware],
  }, controller.list.bind(controller));
}
