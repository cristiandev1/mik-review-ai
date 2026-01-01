import type { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

export async function authRoutes(app: FastifyInstance) {
  const controller = new AuthController();

  // Public routes
  app.post('/signup', controller.signup.bind(controller));
  app.post('/login', controller.login.bind(controller));

  // Protected routes
  app.get('/me', {
    preHandler: [authMiddleware],
  }, controller.me.bind(controller));
}
