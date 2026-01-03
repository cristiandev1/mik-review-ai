import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../modules/auth/auth.service.js';
import { UnauthorizedError } from '../shared/errors/app-error.js';

const authService = new AuthService();

export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    const { userId } = authService.verifyToken(token);

    // Get user from database to have full info (plan, etc)
    const user = await authService.getUserById(userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Attach userId and user to request
    (request as any).userId = userId;
    (request as any).user = user;
  } catch (error: any) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError('Invalid or expired token');
  }
}
