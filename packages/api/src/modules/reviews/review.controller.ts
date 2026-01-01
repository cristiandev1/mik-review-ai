import type { FastifyRequest, FastifyReply } from 'fastify';
import { ReviewService } from './review.service.js';
import { createReviewSchema } from './review.schemas.js';

const reviewService = new ReviewService();

export class ReviewController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
        });
      }

      const input = createReviewSchema.parse(request.body);
      const review = await reviewService.createReview(user.id, input);

      return reply.code(202).send({
        success: true,
        data: review,
        message: 'Review job created and processing',
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.code(400).send({
        success: false,
        error: error.message || 'Failed to create review',
      });
    }
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const { id } = request.params as { id: string };

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
        });
      }

      const review = await reviewService.getReview(id, user.id);

      return reply.code(200).send({
        success: true,
        data: review,
      });
    } catch (error: any) {
      request.log.error(error);

      if (error.message.includes('not found')) {
        return reply.code(404).send({
          success: false,
          error: error.message,
        });
      }

      if (error.message.includes('Unauthorized')) {
        return reply.code(403).send({
          success: false,
          error: error.message,
        });
      }

      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to get review',
      });
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;

      if (!user) {
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
        });
      }

      const reviews = await reviewService.listReviews(user.id);

      return reply.code(200).send({
        success: true,
        data: reviews,
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: error.message || 'Failed to list reviews',
      });
    }
  }
}
