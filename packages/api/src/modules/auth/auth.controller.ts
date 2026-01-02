import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service.js';
import { PasswordResetService } from './password-reset.service.js';
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from './auth.schemas.js';

const authService = new AuthService();
const passwordResetService = new PasswordResetService();

export class AuthController {
  async signup(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = signupSchema.parse(request.body);
      const result = await authService.signup(input);

      return reply.code(201).send({
        success: true,
        data: result,
        message: 'User created successfully',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        error: error.message || 'Signup failed',
      });
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = loginSchema.parse(request.body);
      const result = await authService.login(input);

      return reply.code(200).send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.code(401).send({
        success: false,
        error: error.message || 'Login failed',
      });
    }
  }

  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = forgotPasswordSchema.parse(request.body);
      await passwordResetService.requestPasswordReset(input.email);

      return reply.code(200).send({
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        error: error.message || 'Failed to process request',
      });
    }
  }

  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const input = resetPasswordSchema.parse(request.body);
      const result = await passwordResetService.resetPassword(input.token, input.password);

      if (!result.success) {
        return reply.code(400).send(result);
      }

      return reply.code(200).send(result);
    } catch (error: any) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        error: error.message || 'Failed to reset password',
      });
    }
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    try {
      // User is attached by auth middleware
      const userId = (request as any).userId;

      if (!userId) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
        });
      }

      const user = await authService.getUserById(userId);

      return reply.code(200).send({
        success: true,
        data: user,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to get user',
      });
    }
  }
}
