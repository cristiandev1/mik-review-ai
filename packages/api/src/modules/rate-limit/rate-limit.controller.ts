import type { FastifyRequest, FastifyReply } from 'fastify';
import { RateLimitService } from './rate-limit.service.js';
import type { PlanId } from '../../shared/constants/plans.js';

const rateLimitService = new RateLimitService();

export class RateLimitController {
  async getUsage(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      
      if (!user) {
        return reply.code(401).send({
          success: false,
          error: 'User not found',
        });
      }

      const plan = (user.currentPlan || user.plan || 'trial') as PlanId;
      const userId = user.id;

      const usage = await rateLimitService.getUsage(userId, plan);

      return reply.code(200).send({
        success: true,
        data: usage,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to get rate limit usage',
      });
    }
  }
}
