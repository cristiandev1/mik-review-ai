import { db } from '../../config/database.js';
import { reviews, usageAnalytics } from '../../database/schema.js';
import { eq, and, gte, sql, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { RateLimitService } from '../rate-limit/rate-limit.service.js';
import type { PlanId } from '../../shared/constants/plans.js';

const rateLimitService = new RateLimitService();

export interface UsageStats {
  period: string;
  reviewsCount: number;
  tokensUsed: number;
  avgProcessingTime: number;
  repositories: string[];
}

export interface DashboardStats {
  totalReviews: number;
  reviewsThisMonth: number;
  successRate: number;
  avgProcessingTime: number;
  topRepositories: Array<{ repository: string; count: number }>;
  recentReviews: Array<{
    id: string;
    repository: string;
    pullRequest: number;
    status: string;
    createdAt: Date;
  }>;
  rateLimit: {
    limit: number;
    used: number;
    remaining: number;
    resetAt?: Date;
  };
}

export class AnalyticsService {
  /**
   * Track review usage (called after review is created)
   */
  async trackReview(
    userId: string,
    repository: string,
    tokensUsed: number = 0,
    processingTime: number = 0
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if analytics record exists for today
    const existing = await db
      .select()
      .from(usageAnalytics)
      .where(
        and(
          eq(usageAnalytics.userId, userId),
          eq(usageAnalytics.date, today)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing record
      const current = existing[0];
      const newReviewsCount = current.reviewsCount + 1;
      const newTokensUsed = current.tokensUsed + tokensUsed;

      // Calculate new average processing time
      const totalProcessingTime = current.avgProcessingTime * current.reviewsCount + processingTime;
      const newAvgProcessingTime = Math.floor(totalProcessingTime / newReviewsCount);

      // Add repository if not already in list
      const repositories = current.repositories || [];
      if (!repositories.includes(repository)) {
        repositories.push(repository);
      }

      await db
        .update(usageAnalytics)
        .set({
          reviewsCount: newReviewsCount,
          tokensUsed: newTokensUsed,
          avgProcessingTime: newAvgProcessingTime,
          repositories,
        })
        .where(eq(usageAnalytics.id, current.id));
    } else {
      // Create new record
      await db.insert(usageAnalytics).values({
        id: nanoid(),
        userId,
        date: today,
        reviewsCount: 1,
        tokensUsed,
        avgProcessingTime: processingTime,
        repositories: [repository],
      });
    }
  }

  /**
   * Get usage stats for a specific period
   */
  async getUsageStats(userId: string, days: number = 30): Promise<UsageStats[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const stats = await db
      .select()
      .from(usageAnalytics)
      .where(
        and(
          eq(usageAnalytics.userId, userId),
          gte(usageAnalytics.date, startDate)
        )
      )
      .orderBy(usageAnalytics.date);

    return stats.map((stat) => ({
      period: stat.date.toISOString().split('T')[0],
      reviewsCount: stat.reviewsCount,
      tokensUsed: stat.tokensUsed,
      avgProcessingTime: stat.avgProcessingTime,
      repositories: stat.repositories || [],
    }));
  }

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(userId: string, plan: PlanId): Promise<DashboardStats> {
    // Get total reviews
    const totalReviewsResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(reviews)
      .where(eq(reviews.userId, userId));

    const totalReviews = totalReviewsResult[0]?.count || 0;

    // Get reviews this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const reviewsThisMonthResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          gte(reviews.createdAt, startOfMonth)
        )
      );

    const reviewsThisMonth = reviewsThisMonthResult[0]?.count || 0;

    // Calculate success rate
    const successfulReviewsResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.status, 'completed')
        )
      );

    const successfulReviews = successfulReviewsResult[0]?.count || 0;
    const successRate = totalReviews > 0 ? (successfulReviews / totalReviews) * 100 : 100;

    // Calculate average processing time
    const avgProcessingTimeResult = await db
      .select({ avg: sql<number>`cast(avg(processing_time) as integer)` })
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.status, 'completed')
        )
      );

    const avgProcessingTime = avgProcessingTimeResult[0]?.avg || 0;

    // Get top repositories
    const topRepositoriesResult = await db
      .select({
        repository: reviews.repository,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .groupBy(reviews.repository)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    const topRepositories = topRepositoriesResult.map((r) => ({
      repository: r.repository,
      count: r.count,
    }));

    // Get recent reviews
    const recentReviewsResult = await db
      .select({
        id: reviews.id,
        repository: reviews.repository,
        pullRequest: reviews.pullRequest,
        status: reviews.status,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt))
      .limit(10);

    const recentReviews = recentReviewsResult.map((r) => ({
      id: r.id,
      repository: r.repository,
      pullRequest: r.pullRequest,
      status: r.status,
      createdAt: r.createdAt,
    }));

    // Get rate limit info
    const rateLimitInfo = await rateLimitService.getUsage(userId, plan);

    return {
      totalReviews,
      reviewsThisMonth,
      successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
      avgProcessingTime,
      topRepositories,
      recentReviews,
      rateLimit: {
        limit: rateLimitInfo.limit,
        used: rateLimitInfo.used,
        remaining: rateLimitInfo.remaining,
        resetAt: rateLimitInfo.resetAt,
      },
    };
  }

  /**
   * Backfill analytics from existing reviews
   * Useful for populating analytics for reviews created before analytics tracking was added
   */
  async backfillAnalytics(userId: string): Promise<{ processed: number }> {
    // Get all completed reviews for this user
    const completedReviews = await db
      .select({
        id: reviews.id,
        repository: reviews.repository,
        tokensUsed: reviews.tokensUsed,
        processingTime: reviews.processingTime,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.status, 'completed')
        )
      )
      .orderBy(reviews.createdAt);

    let processed = 0;

    for (const review of completedReviews) {
      try {
        // Group by date
        const reviewDate = new Date(review.createdAt);
        reviewDate.setHours(0, 0, 0, 0);

        // Check if analytics record exists for this date
        const existing = await db
          .select()
          .from(usageAnalytics)
          .where(
            and(
              eq(usageAnalytics.userId, userId),
              eq(usageAnalytics.date, reviewDate)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Update existing record
          const current = existing[0];
          const newReviewsCount = current.reviewsCount + 1;
          const newTokensUsed = current.tokensUsed + (review.tokensUsed || 0);

          // Calculate new average processing time
          const totalProcessingTime = current.avgProcessingTime * current.reviewsCount + (review.processingTime || 0);
          const newAvgProcessingTime = Math.floor(totalProcessingTime / newReviewsCount);

          // Add repository if not already in list
          const repositories = current.repositories || [];
          if (!repositories.includes(review.repository)) {
            repositories.push(review.repository);
          }

          await db
            .update(usageAnalytics)
            .set({
              reviewsCount: newReviewsCount,
              tokensUsed: newTokensUsed,
              avgProcessingTime: newAvgProcessingTime,
              repositories,
            })
            .where(eq(usageAnalytics.id, current.id));
        } else {
          // Create new record
          await db.insert(usageAnalytics).values({
            id: nanoid(),
            userId,
            date: reviewDate,
            reviewsCount: 1,
            tokensUsed: review.tokensUsed || 0,
            avgProcessingTime: review.processingTime || 0,
            repositories: [review.repository],
          });
        }

        processed++;
      } catch (error: any) {
        // Log error but continue processing other reviews
        console.error(`Failed to backfill analytics for review ${review.id}:`, error);
      }
    }

    return { processed };
  }
}
