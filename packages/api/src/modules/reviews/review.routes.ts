import type { FastifyInstance } from 'fastify';
import { ReviewController } from './review.controller.js';
import { apiKeyMiddleware } from '../../middleware/api-key.middleware.js';

export async function reviewRoutes(app: FastifyInstance) {
  const controller = new ReviewController();

  // All review routes require API key authentication
  app.post('/', {
    preHandler: [apiKeyMiddleware],
  }, controller.create.bind(controller));

  app.get('/:id', {
    preHandler: [apiKeyMiddleware],
  }, controller.getById.bind(controller));

  app.get('/', {
    preHandler: [apiKeyMiddleware],
  }, controller.list.bind(controller));
}
