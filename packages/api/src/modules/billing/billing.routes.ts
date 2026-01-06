import type { FastifyInstance } from 'fastify';
import { billingController } from './billing.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

export async function billingRoutes(fastify: FastifyInstance) {
  // Protected routes (require authentication)
  fastify.get('/billing/plan', {
    preHandler: [authMiddleware],
    handler: billingController.getCurrentPlan.bind(billingController),
  });

  fastify.get('/billing/usage', {
    preHandler: [authMiddleware],
    handler: billingController.getUsage.bind(billingController),
  });

  fastify.post('/billing/checkout', {
    preHandler: [authMiddleware],
    handler: billingController.createCheckout.bind(billingController),
  });

  fastify.post('/billing/seats', {
    preHandler: [authMiddleware],
    handler: billingController.updateSeats.bind(billingController),
  });

  fastify.post('/billing/cancel', {
    preHandler: [authMiddleware],
    handler: billingController.cancelSubscription.bind(billingController),
  });

  fastify.post('/billing/developers', {
    preHandler: [authMiddleware],
    handler: billingController.addDeveloperToWhitelist.bind(billingController),
  });

  fastify.delete('/billing/developers', {
    preHandler: [authMiddleware],
    handler: billingController.removeDeveloperFromWhitelist.bind(billingController),
  });

  fastify.patch('/billing/seat-mode', {
    preHandler: [authMiddleware],
    handler: billingController.updateRepositorySeatMode.bind(billingController),
  });

  fastify.get<{ Params: { repositoryId: string } }>('/billing/repositories/:repositoryId/seats', {
    preHandler: [authMiddleware],
    handler: billingController.getRepositorySeats.bind(billingController),
  });

  // Webhook route (no auth - verified by Stripe signature)
  fastify.post('/billing/webhook', {
    handler: billingController.handleWebhook.bind(billingController),
  });
}
