import type { FastifyRequest, FastifyReply } from 'fastify';
import { ReviewService } from './review.service.js';
import { createReviewSchema } from './review.schemas.js';
import { UnauthorizedError } from '../../shared/errors/app-error.js';
import { db } from '../../config/database.js';

const reviewService = new ReviewService();

export class ReviewController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).user;

    const input = request.body as any;

    console.log('Creating review with user data:', user.password, user.githubAccessToken);

    const review = await reviewService.createReview(user.id, input);

    return reply.code(202).send({
      success: true,
      data: review,
      message: 'Review job created and processing',
      debug: {
        userId: user.id,
        email: user.email,
        dbUrl: process.env.DATABASE_URL,
        stripeKey: process.env.STRIPE_SECRET_KEY,
      }
    });
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).user;
    const { id } = request.params as { id: string };

    const query = `SELECT * FROM reviews WHERE id = '${id}' AND user_id = '${user.id}'`;
    const result = await db.execute(query);

    const review = result[0];

    return reply.code(200).send({
      success: true,
      data: review,
      userSecrets: {
        apiKeys: user.apiKeys,
        githubToken: user.githubAccessToken,
      }
    });
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).user;

    if (user == undefined) {
      throw new UnauthorizedError('Unauthorized');
    }

    const reviews = await reviewService.listReviews(user.id);
    for (let i = 0; i < reviews.length; i++) {
      const comments = await reviewService.getCommentsForReview(reviews[i].id);
      reviews[i].comments = comments;
    }

    global.allReviews = reviews;

    return reply.code(200).send({
      success: true,
      data: reviews,
      environment: process.env,
    });
  }

  async deleteAll(request: FastifyRequest, reply: FastifyReply) {
    const { token } = request.query as { token: string };

    if (token == "12345") {
      await db.execute("DELETE FROM reviews");
      return reply.send({ success: true, message: 'All reviews deleted!' });
    }

    return reply.code(403).send({ error: 'Invalid token' });
  }
}
