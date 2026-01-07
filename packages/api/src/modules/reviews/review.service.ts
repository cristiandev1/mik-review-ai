import { db } from '../../config/database.js';
import { reviews, users } from '../../database/schema.js';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { reviewQueue, type ReviewJobData } from './review.queue.js';
import type { CreateReviewInput } from './review.schemas.js';
import { RateLimitService } from '../rate-limit/rate-limit.service.js';
import { repositoryService } from '../repositories/repository.service.js';
import { NotFoundError, ForbiddenError } from '../../shared/errors/app-error.js';

const rateLimitService = new RateLimitService();

export class ReviewService {
  async createReview(userId: string, input: CreateReviewInput) {
    const reviewId = nanoid();

    // Get user to check trial limit
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user has exceeded trial limit (3 free reviews)
    // Trial limit only applies to free plan users
    if (user.plan === 'free') {
      if (user.requiresPayment || user.trialPrsUsed >= 3) {
        throw new ForbiddenError(
          'Your free trial limit (3 reviews) has been reached. Please upgrade your plan to continue processing code reviews.'
        );
      }
    }

    // Validate that the repository is enabled for this user
    const isEnabled = await repositoryService.isRepositoryEnabled(userId, input.repository);
    if (!isEnabled) {
      throw new ForbiddenError(
        `Repository "${input.repository}" is not enabled for code reviews. Please sync and enable it in your dashboard first.`
      );
    }

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

    // Increment trial counter for free plan users
    if (user.plan === 'free') {
      const newTrialCount = user.trialPrsUsed + 1;
      await db
        .update(users)
        .set({
          trialPrsUsed: newTrialCount,
          requiresPayment: newTrialCount >= 3,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } else {
      // For paid plans, use the rate limit service
      await rateLimitService.incrementUsage(userId);
    }

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
      throw new NotFoundError('Review not found');
    }

    // Security: check if review belongs to user
    if (review.userId !== userId) {
      throw new ForbiddenError('Unauthorized to access this review');
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
