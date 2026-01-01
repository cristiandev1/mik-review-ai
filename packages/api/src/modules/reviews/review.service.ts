import { db } from '../../config/database.js';
import { reviews } from '../../database/schema.js';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { reviewQueue, type ReviewJobData } from './review.queue.js';
import type { CreateReviewInput } from './review.schemas.js';
import { RateLimitService } from '../rate-limit/rate-limit.service.js';

const rateLimitService = new RateLimitService();

export class ReviewService {
  async createReview(userId: string, input: CreateReviewInput) {
    const reviewId = nanoid();

    // Create review record in database
    await db.insert(reviews).values({
      id: reviewId,
      userId,
      repository: input.repository,
      pullRequest: input.pullRequest,
      status: 'processing',
    });

    // Add job to queue
    const jobData: ReviewJobData = {
      reviewId,
      userId,
      repository: input.repository,
      pullRequest: input.pullRequest,
      githubToken: input.githubToken,
    };

    await reviewQueue.add('process-review', jobData, {
      jobId: reviewId, // Use reviewId as jobId for easy lookup
    });

    // Increment usage counter for rate limiting
    await rateLimitService.incrementUsage(userId);

    return {
      id: reviewId,
      status: 'processing',
      message: 'Review job created successfully',
    };
  }

  async getReview(reviewId: string, userId: string) {
    const [review] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!review) {
      throw new Error('Review not found');
    }

    // Security: check if review belongs to user
    if (review.userId !== userId) {
      throw new Error('Unauthorized to access this review');
    }

    // Get job from queue for progress
    const job = await reviewQueue.getJob(reviewId);

    return {
      id: review.id,
      repository: review.repository,
      pullRequest: review.pullRequest,
      status: review.status,
      summary: review.summary,
      comments: review.comments,
      progress: job ? job.progress : 100,
      error: review.error,
      createdAt: review.createdAt,
      completedAt: review.completedAt,
    };
  }

  async listReviews(userId: string, limit: number = 20) {
    const userReviews = await db
      .select({
        id: reviews.id,
        repository: reviews.repository,
        pullRequest: reviews.pullRequest,
        status: reviews.status,
        createdAt: reviews.createdAt,
        completedAt: reviews.completedAt,
      })
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(reviews.createdAt)
      .limit(limit);

    return userReviews;
  }
}
