import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service.js';
import { PasswordResetService } from './password-reset.service.js';
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, updateProfileSchema } from './auth.schemas.js';

const authService = new AuthService();
const passwordResetService = new PasswordResetService();

export class AuthController {
  async signup(request: FastifyRequest, reply: FastifyReply) {
    const input = signupSchema.parse(request.body);
    const result = await authService.signup(input);

    return reply.code(201).send({
      success: true,
      data: result,
      message: 'User created successfully',
    });
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    const input = loginSchema.parse(request.body);
    const result = await authService.login(input);

    return reply.code(200).send({
      success: true,
      data: result,
    });
  }

  async forgotPassword(request: FastifyRequest, reply: FastifyReply) {
    const input = forgotPasswordSchema.parse(request.body);
    await passwordResetService.requestPasswordReset(input.email);

    return reply.code(200).send({
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
    });
  }

  async resetPassword(request: FastifyRequest, reply: FastifyReply) {
    const input = resetPasswordSchema.parse(request.body);
    const result = await passwordResetService.resetPassword(input.token, input.password);

    if (!result.success) {
      return reply.code(400).send(result);
    }

    return reply.code(200).send(result);
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    // User is attached by auth middleware
    const userId = (request as any).userId;

    if (!userId) {
      // This should ideally be handled by middleware, but extra check is fine
      throw new Error('Unauthorized');
      // Or UnauthorizedError if we want to be strict, but middleware should catch it
    }

    const user = await authService.getUserById(userId);

    return reply.code(200).send({
      success: true,
      data: user,
    });
  }

  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).userId;
    const input = updateProfileSchema.parse(request.body);

    const user = await authService.updateProfile(userId, input);

    return reply.code(200).send({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  }

  async disconnectGithub(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).userId;

    await authService.disconnectGithub(userId);

    return reply.code(200).send({
      success: true,
      message: 'GitHub account disconnected successfully',
    });
  }
}
