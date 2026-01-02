import type { FastifyInstance } from 'fastify';
import { AuthController } from './auth.controller.js';
import { GitHubOAuthController } from './github-oauth.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

export async function authRoutes(app: FastifyInstance) {
  const controller = new AuthController();
  const githubController = new GitHubOAuthController();

  // Public routes
  app.post('/signup', controller.signup.bind(controller));
  app.post('/login', controller.login.bind(controller));
  app.post('/forgot-password', controller.forgotPassword.bind(controller));
  app.post('/reset-password', controller.resetPassword.bind(controller));
  
  // GitHub OAuth
  app.post('/github/callback', githubController.callback.bind(githubController));

  // Protected routes
  app.get('/me', {
    preHandler: [authMiddleware],
  }, controller.me.bind(controller));
}
