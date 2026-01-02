import type { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/database.js';
import { users } from '../database/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Middleware to check if user's email is verified
 * Should be used after authMiddleware
 */
export async function emailVerifiedMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const user = (request as any).user;

    if (!user || !user.id) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    // Get latest user data from database
    const [userData] = await db
      .select({
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!userData) {
      return reply.status(401).send({
        success: false,
        error: 'User not found',
      });
    }

    if (!userData.emailVerified) {
      return reply.status(403).send({
        success: false,
        error: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Please verify your email address before accessing this resource',
      });
    }

    // Email is verified, continue
  } catch (error: any) {
    return reply.status(500).send({
      success: false,
      error: 'Internal server error',
    });
  }
}
