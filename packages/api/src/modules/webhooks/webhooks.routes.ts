import { FastifyInstance } from 'fastify';
import { WebhooksController } from './webhooks.controller.js';

const controller = new WebhooksController();

export async function webhooksRoutes(app: FastifyInstance) {
  app.post('/webhooks/github', controller.handleGitHub);
}
