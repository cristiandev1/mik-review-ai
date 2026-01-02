import type { FastifyInstance } from 'fastify';
import { VerificationController } from './verification.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

export async function verificationRoutes(fastify: FastifyInstance) {
  const controller = new VerificationController();

  // Verify email (no auth required)
  fastify.post('/verify-email', controller.verifyEmail.bind(controller));

  // Resend verification email (requires auth)
  fastify.post(
    '/resend-verification',
    {
      onRequest: [authMiddleware],
    },
    controller.resendVerification.bind(controller)
  );
}
