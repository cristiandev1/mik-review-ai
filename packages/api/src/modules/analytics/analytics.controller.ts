import type { FastifyRequest, FastifyReply } from 'fastify';
import { AnalyticsService } from './analytics.service.js';
import type { PlanId } from '../../shared/constants/plans.js';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async getUsage(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).userId;

      if (!userId) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
        });
      }

      const { days } = request.query as { days?: string };
      const period = days ? parseInt(days) : 30;

      const stats = await analyticsService.getUsageStats(userId, period);

      return reply.code(200).send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to get usage stats',
      });
    }
  }

  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const userId = (request as any).userId;

      if (!userId) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
        });
      }

      // Get user's plan from auth middleware (attached by authMiddleware)
      const plan = (user?.plan || 'free') as PlanId;

      const stats = await analyticsService.getDashboardStats(userId, plan);

      return reply.code(200).send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to get dashboard stats',
      });
    }
  }

  async backfillAnalytics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).userId;

      if (!userId) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
        });
      }

      const result = await analyticsService.backfillAnalytics(userId);

      return reply.code(200).send({
        success: true,
        data: result,
        message: `Successfully backfilled analytics for ${result.processed} reviews`,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to backfill analytics',
      });
    }
  }
}
