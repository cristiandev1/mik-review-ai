import type { FastifyInstance } from 'fastify';
import { AnalyticsController } from './analytics.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

export async function analyticsRoutes(app: FastifyInstance) {
  const controller = new AnalyticsController();

  // All analytics routes require JWT authentication
  app.get('/usage', {
    preHandler: [authMiddleware],
  }, controller.getUsage.bind(controller));

  app.get('/dashboard', {
    preHandler: [authMiddleware],
  }, controller.getDashboard.bind(controller));

  app.post('/backfill', {
    preHandler: [authMiddleware],
  }, controller.backfillAnalytics.bind(controller));
}
