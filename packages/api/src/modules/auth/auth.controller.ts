import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service.js';
import { signupSchema, loginSchema } from './auth.schemas.js';

const authService = new AuthService();

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
