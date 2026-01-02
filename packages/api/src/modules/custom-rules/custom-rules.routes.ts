import type { FastifyInstance } from 'fastify';
import { CustomRulesController } from './custom-rules.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

export async function customRulesRoutes(fastify: FastifyInstance) {
  const controller = new CustomRulesController();

  // All routes require JWT authentication
  fastify.addHook('onRequest', authMiddleware);

  // Create custom rule
  fastify.post('/', controller.create.bind(controller));

  // Get custom rule by ID
  fastify.get('/:id', controller.getById.bind(controller));

  // List custom rules
  fastify.get('/', controller.list.bind(controller));

  // Update custom rule
  fastify.put('/:id', controller.update.bind(controller));

  // Delete custom rule
  fastify.delete('/:id', controller.delete.bind(controller));
}
