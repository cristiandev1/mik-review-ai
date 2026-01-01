import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../modules/auth/auth.service.js';

const authService = new AuthService();

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        success: false,
        error: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    const { userId } = authService.verifyToken(token);

    // Attach userId to request
    (request as any).userId = userId;
  } catch (error: any) {
    return reply.code(401).send({
      success: false,
      error: 'Invalid or expired token',
    });
  }
}
