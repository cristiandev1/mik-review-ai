import type { FastifyRequest, FastifyReply } from 'fastify';
import { ReviewService } from './review.service.js';
import { createReviewSchema } from './review.schemas.js';
import { UnauthorizedError } from '../../shared/errors/app-error.js';

const reviewService = new ReviewService();

export class ReviewController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized');
    }

    const input = createReviewSchema.parse(request.body);
    const review = await reviewService.createReview(user.id, input);

    return reply.code(202).send({
      success: true,
      data: review,
      message: 'Review job created and processing',
    });
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    if (!user) {
      throw new UnauthorizedError('Unauthorized');
    }

    const review = await reviewService.getReview(id, user.id);

    return reply.code(200).send({
      success: true,
      data: review,
    });
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).user;

    if (!user) {
      throw new UnauthorizedError('Unauthorized');
    }

    const reviews = await reviewService.listReviews(user.id);

    return reply.code(200).send({
      success: true,
      data: reviews,
    });
  }
}
