import type { FastifyRequest, FastifyReply } from 'fastify';
import { VerificationService } from './verification.service.js';
import { verifyEmailSchema, type VerifyEmailInput } from './verification.schemas.js';

const verificationService = new VerificationService();

export class VerificationController {
  /**
   * Verify email with token
   * POST /auth/verify-email
   */
  async verifyEmail(
    request: FastifyRequest<{ Body: VerifyEmailInput }>,
    reply: FastifyReply
  ) {
    try {
      const { token } = verifyEmailSchema.parse(request.body);

      const result = await verificationService.verifyEmail(token);

      if (!result.success) {
        return reply.status(400).send({
          success: false,
          message: result.message,
        });
      }

      return reply.status(200).send({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Resend verification email
   * POST /auth/resend-verification
   * Requires JWT authentication
   */
  async resendVerification(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user.id;

      await verificationService.resendVerificationEmail(userId);

      return reply.status(200).send({
        success: true,
        message: 'Verification email sent successfully',
      });
    } catch (error: any) {
      const statusCode = error.message === 'Email is already verified' ? 400 : 500;

      return reply.status(statusCode).send({
        success: false,
        error: error.message,
      });
    }
  }
}
