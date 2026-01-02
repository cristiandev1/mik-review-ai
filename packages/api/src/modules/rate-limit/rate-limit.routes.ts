import type { FastifyInstance } from 'fastify';
import { RateLimitController } from './rate-limit.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

export async function rateLimitRoutes(app: FastifyInstance) {
  const controller = new RateLimitController();

  app.get('/usage', {
    preHandler: [authMiddleware],
  }, controller.getUsage.bind(controller));
}
