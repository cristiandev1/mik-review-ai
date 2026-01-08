import type { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/database.js';
import { users, subscriptions, repositories, repositorySeats, usageTracking } from '../database/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { AppError } from '../shared/errors/app-error.js';
import { logger } from '../shared/utils/logger.js';
import { nanoid } from 'nanoid';

/**
 * Billing verification middleware
 * Checks trial status, subscription status, and seat availability before allowing reviews
 */
export async function verifyBillingAccess(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  const userId = (request as any).userId;
  const { repositoryId, developerGithubUsername } = (request as any).reviewContext;

  if (!userId || !repositoryId || !developerGithubUsername) {
    throw new AppError('Missing required context for billing verification', 400);
  }

  // Get user
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userResult.length) {
    throw new AppError('User not found', 404);
  }

  const user = userResult[0];

  // 1. Check if trial is still valid
  if (user.currentPlan === 'trial' && !user.trialExpired) {
    if (user.trialPrsUsed >= 3 || user.trialTokensUsed >= 300000) {
      // Expire trial
      await db
        .update(users)
        .set({ trialExpired: true, requiresPayment: true })
        .where(eq(users.id, userId));

      throw new AppError('Trial limit reached. Please upgrade to a paid plan.', 403);
    }
    // Trial still valid - allow request to proceed
    return;
  }

  // 2. If trial is expired or user is not on trial, check subscription
  if (user.currentPlan === 'trial' && user.trialExpired) {
    throw new AppError('Trial expired. Please select a paid plan to continue.', 403);
  }

  // Check if user has active subscription
  const subscriptionResult = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!subscriptionResult.length || subscriptionResult[0].status !== 'active') {
    throw new AppError('Active subscription required. Please upgrade to continue.', 403);
  }

  const subscription = subscriptionResult[0];

  // 3. Get repository details
  const repoResult = await db
    .select()
    .from(repositories)
    .where(eq(repositories.id, repositoryId))
    .limit(1);

  if (!repoResult.length) {
    throw new AppError('Repository not found', 404);
  }

  const repo = repoResult[0];

  // 4. Check seat availability based on mode
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  if (repo.seatMode === 'whitelist') {
    // Whitelist mode: check if developer is whitelisted
    const whitelist = (repo.whitelistedDevelopers || []) as string[];
    if (!whitelist.includes(developerGithubUsername)) {
      throw new AppError(
        `Developer ${developerGithubUsername} is not authorized for this repository. Add them to the whitelist.`,
        403
      );
    }
  } else {
    // Auto-add mode: check and assign seats
    const usedSeatsResult = await db
      .select()
      .from(repositorySeats)
      .where(
        and(
          eq(repositorySeats.repositoryId, repositoryId),
          eq(repositorySeats.billingMonth, currentMonth),
          eq(repositorySeats.isActive, true)
        )
      );

    const seatCount = usedSeatsResult.length;
    const seatsPurchased = subscription.seatsPurchased || 1;

    // Check if developer already has a seat
    const existingSeat = usedSeatsResult.find(
      (s) => s.developerGithubUsername === developerGithubUsername
    );

    if (!existingSeat) {
      // Check if seats are available
      if (seatCount >= seatsPurchased) {
        throw new AppError(
          `No available seats for repository. Current: ${seatCount}/${seatsPurchased}. Please purchase more seats.`,
          403
        );
      }

      // Assign new seat
      try {
        await db.insert(repositorySeats).values({
          id: nanoid(),
          repositoryId,
          developerGithubUsername,
          billingMonth: currentMonth,
          isActive: true,
        });

        logger.info(`Assigned seat to ${developerGithubUsername} in repository ${repositoryId}`);
      } catch (error) {
        logger.error('Error assigning seat', { error, repositoryId, developerGithubUsername });
        // Don't throw here - just log, as the seat might have been created by another request
      }
    }
  }
}

/**
 * Track usage for trial and paid users
 */
export async function trackUsage(
  userId: string,
  repositoryId: string,
  developerGithubUsername: string,
  tokensUsed: number
) {
  try {
    // Get user
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userResult.length) {
      logger.error('User not found for usage tracking', { userId });
      return;
    }

    const user = userResult[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    // If user is on trial, update trial usage
    if (user.currentPlan === 'trial' && !user.trialExpired) {
      const newPrsUsed = (user.trialPrsUsed || 0) + 1;
      const newTokensUsed = (user.trialTokensUsed || 0) + tokensUsed;

      await db
        .update(users)
        .set({
          trialPrsUsed: newPrsUsed,
          trialTokensUsed: newTokensUsed,
          // Auto-expire trial if limits are reached
          trialExpired: newPrsUsed >= 3 || newTokensUsed >= 300000,
        })
        .where(eq(users.id, userId));

      return;
    }

    // For paid users, update usage tracking
    const existingUsage = await db
      .select()
      .from(usageTracking)
      .where(
        and(
          eq(usageTracking.userId, userId),
          eq(usageTracking.repositoryId, repositoryId),
          eq(usageTracking.developerGithubUsername, developerGithubUsername),
          eq(usageTracking.billingMonth, currentMonth)
        )
      )
      .limit(1);

    if (existingUsage.length > 0) {
      // Update existing record
      await db
        .update(usageTracking)
        .set({
          prsProcessed: existingUsage[0].prsProcessed + 1,
          tokensConsumed: existingUsage[0].tokensConsumed + tokensUsed,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(usageTracking.userId, userId),
            eq(usageTracking.repositoryId, repositoryId),
            eq(usageTracking.developerGithubUsername, developerGithubUsername),
            eq(usageTracking.billingMonth, currentMonth)
          )
        );
    } else {
      // Create new record
      await db.insert(usageTracking).values({
        id: nanoid(),
        userId,
        repositoryId,
        developerGithubUsername,
        prsProcessed: 1,
        tokensConsumed: tokensUsed,
        billingMonth: currentMonth,
      });
    }
  } catch (error) {
    logger.error('Error tracking usage', { error, userId, repositoryId, developerGithubUsername });
    // Don't throw - usage tracking failure shouldn't block reviews
  }
}
