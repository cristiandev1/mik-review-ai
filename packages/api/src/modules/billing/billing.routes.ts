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
  // IMPORTANT: We need the raw body for Stripe signature verification
  fastify.post('/billing/webhook', {
    preParsing: async (request, _reply, payload) => {
      // Capture raw body for Stripe signature verification
      const chunks: Buffer[] = [];
      for await (const chunk of payload) {
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks);
      (request as any).rawBody = rawBody.toString('utf8');

      // Return a new readable stream with the same data
      const { Readable } = await import('stream');
      return Readable.from(Buffer.concat(chunks));
    },
    handler: billingController.handleWebhook.bind(billingController),
  });
}
