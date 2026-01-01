import type { FastifyRequest, FastifyReply } from 'fastify';
import { RateLimitService } from '../modules/rate-limit/rate-limit.service.js';
import type { PlanId } from '../shared/constants/plans.js';

const rateLimitService = new RateLimitService();

/**
 * Rate limit middleware - checks if user has exceeded monthly review limit
 * Must be used AFTER apiKeyMiddleware or authMiddleware (requires user data)
 */
export async function rateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const user = (request as any).user;

    if (!user) {
      return reply.code(401).send({
        success: false,
        error: 'Unauthorized - user not found',
      });
    }

    const plan = (user.userPlan || user.plan || 'free') as PlanId;
    const userId = user.userId || user.id;

    // Check rate limit
    const result = await rateLimitService.checkLimit(userId, plan);

    // Add rate limit info to response headers
    reply.header('X-RateLimit-Limit', result.limit.toString());
    reply.header('X-RateLimit-Remaining', result.remaining.toString());
    reply.header('X-RateLimit-Used', result.used.toString());

    if (result.resetAt) {
      reply.header('X-RateLimit-Reset', result.resetAt.toISOString());
    }

    if (!result.allowed) {
      return reply.code(429).send({
        success: false,
        error: result.error?.message || 'Rate limit exceeded',
        code: result.error?.code || 'RATE_LIMIT_EXCEEDED',
        upgradeUrl: result.error?.upgradeUrl,
        limit: result.limit,
        used: result.used,
        remaining: result.remaining,
        resetAt: result.resetAt,
      });
    }

    // User is within limits, continue
  } catch (error: any) {
    request.log.error(error, 'Rate limit check failed');
    // Don't block request if rate limit check fails
    // Log error and continue
  }
}
