import type { FastifyRequest, FastifyReply } from 'fastify';
import { billingService } from './billing.service.js';
import {
  createCheckoutSchema,
  updateSeatsSchema,
  addDeveloperSchema,
  removeDeveloperSchema,
  updateSeatModeSchema,
} from './billing.schemas.js';
import { db } from '../../config/database.js';
import { users, subscriptions, repositories, repositorySeats, usageTracking } from '../../database/schema.js';
import { eq, and, ne, isNotNull, desc } from 'drizzle-orm';
import { NotFoundError } from '../../shared/errors/app-error.js';

export class BillingController {
  /**
   * Get current plan for user
   */
  async getCurrentPlan(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).userId;

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user.length) {
      throw new NotFoundError('User not found');
    }

    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    const userData = user[0];
    const subscriptionData = subscription[0] || null;

    // Map to BillingPlan structure expected by frontend
    const plan: any = {
      plan: userData.currentPlan as 'trial' | 'hobby' | 'pro',
      status: subscriptionData?.status || 'active',
      seatsPurchased: subscriptionData?.seatsPurchased || 1,
      seatsUsed: subscriptionData?.seatsUsed || 0,
      currentPeriodEnd: subscriptionData?.currentPeriodEnd?.toISOString(),
      updatePaymentUrl: null, // TODO: Add Stripe Customer Portal URL if needed
    };

    return reply.code(200).send({
      success: true,
      data: plan,
    });
  }

  /**
   * Get monthly usage with plan limits
   * Plan limits: free=3 total, hobby=15/month, pro=100/month
   */
  async getUsage(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).userId;

    const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!userRecord.length) {
      throw new NotFoundError('User not found');
    }

    const user = userRecord[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Get subscription for seats calculation
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    const seats = subscription[0]?.seatsPurchased || 1;

    // Determine plan limits
    // Free (trial): 3 PRs total (lifetime)
    // Hobby: 15 PRs/month per seat ($5/month)
    // Pro: 100 PRs/month per seat ($15/month)
    let prsLimit = -1; // Unlimited by default
    let tokensLimit = -1; // Unlimited by default
    let prsUsed = 0;
    let tokensUsed = 0;

    if (user.currentPlan === 'trial') {
      prsLimit = 3;
      tokensLimit = 300000;
      prsUsed = user.trialPrsUsed || 0;
      tokensUsed = user.trialTokensUsed || 0;
    } else {
      if (user.currentPlan === 'hobby') {
        prsLimit = 15 * seats; // Hobby: 15 PRs/month per seat
      } else if (user.currentPlan === 'pro') {
        prsLimit = 100 * seats; // Pro: 100 PRs/month per seat
      }

      // Get usage data for current month from usageTracking
      const usageData = await db
        .select()
        .from(usageTracking)
        .where(and(eq(usageTracking.userId, userId), eq(usageTracking.billingMonth, currentMonth)));

      prsUsed = usageData.reduce((sum, u) => sum + (u.prsProcessed || 0), 0);
      tokensUsed = usageData.reduce((sum, u) => sum + (u.tokensConsumed || 0), 0);
    }

    return reply.code(200).send({
      success: true,
      data: {
        prsUsed,
        prsLimit,
        tokensUsed,
        tokensLimit,
        billingMonth: currentMonth,
      },
    });
  }

  /**
   * Create checkout session
   */
  async createCheckout(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).userId;
    const input = createCheckoutSchema.parse(request.body);

    const result = await billingService.createCheckoutSession(userId, input.plan, input.seats);

    return reply.code(201).send({
      success: true,
      data: result,
      message: 'Checkout session created successfully',
    });
  }

  /**
   * Update subscription seats
   */
  async updateSeats(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).userId;
    const input = updateSeatsSchema.parse(request.body);

    // Verify subscription belongs to user
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.stripeSubscriptionId, input.subscriptionId)))
      .limit(1);

    if (!subscription.length) {
      throw new NotFoundError('Subscription not found');
    }

    await billingService.updateSubscriptionSeats(input.subscriptionId, input.seats);

    return reply.code(200).send({
      success: true,
      message: 'Seats updated successfully',
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).userId;
    const body = request.body as { subscriptionId?: string } | undefined;
    const subscriptionId = body?.subscriptionId;

    let subscription;

    if (subscriptionId) {
      // Verify subscription belongs to user
      subscription = await db
        .select()
        .from(subscriptions)
        .where(and(eq(subscriptions.userId, userId), eq(subscriptions.stripeSubscriptionId, subscriptionId)))
        .limit(1);
    } else {
      // Find active subscription for user
      subscription = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, userId),
            ne(subscriptions.status, 'canceled'),
            isNotNull(subscriptions.stripeSubscriptionId)
          )
        )
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);
    }

    if (!subscription.length) {
      throw new NotFoundError('Subscription not found or already canceled');
    }

    const stripeId = subscription[0].stripeSubscriptionId;
    if (!stripeId) {
      throw new NotFoundError('Subscription has no Stripe ID');
    }

    await billingService.cancelSubscription(stripeId);

    return reply.code(200).send({
      success: true,
      message: 'Subscription canceled successfully',
    });
  }

  /**
   * Handle Stripe webhook
   */
  async handleWebhook(request: FastifyRequest, reply: FastifyReply) {
    try {
      const signature = request.headers['stripe-signature'] as string;

      if (!signature) {
        request.log.error('Missing stripe-signature header');
        return reply.code(400).send({
          success: false,
          error: 'Missing stripe-signature header',
        });
      }

      const body = (request as any).rawBody || JSON.stringify(request.body);

      request.log.info({ eventType: 'webhook_received' }, 'Stripe webhook received');

      const event = billingService.constructWebhookEvent(body, signature);

      request.log.info({ eventType: event.type, eventId: event.id }, 'Processing Stripe webhook event');

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed':
          await billingService.handleCheckoutCompleted(event.data.object);
          request.log.info({ eventId: event.id }, 'Checkout session completed processed successfully');
          break;

        case 'customer.subscription.updated':
          await billingService.handleSubscriptionUpdated(event.data.object);
          request.log.info({ eventId: event.id }, 'Subscription updated processed successfully');
          break;

        case 'customer.subscription.deleted':
          await billingService.handleSubscriptionDeleted(event.data.object);
          request.log.info({ eventId: event.id }, 'Subscription deleted processed successfully');
          break;

        case 'invoice.payment_succeeded':
          await billingService.handleInvoicePaymentSucceeded(event.data.object);
          request.log.info({ eventId: event.id }, 'Invoice payment succeeded processed successfully');
          break;

        case 'invoice.payment_failed':
          await billingService.handleInvoicePaymentFailed(event.data.object);
          request.log.info({ eventId: event.id }, 'Invoice payment failed processed successfully');
          break;

        default:
          request.log.info({ eventType: event.type, eventId: event.id }, 'Unhandled webhook event type');
      }

      return reply.code(200).send({
        success: true,
        received: true,
      });
    } catch (error: any) {
      request.log.error({ error: error.message, stack: error.stack }, 'Error processing webhook');
      return reply.code(400).send({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Add developer to repository whitelist
   */
  async addDeveloperToWhitelist(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).userId;
    const input = addDeveloperSchema.parse(request.body);

    // Verify repository belongs to user
    const repository = await db
      .select()
      .from(repositories)
      .where(and(eq(repositories.userId, userId), eq(repositories.id, input.repositoryId)))
      .limit(1);

    if (!repository.length) {
      throw new NotFoundError('Repository not found');
    }

    const repo = repository[0];

    // Add developer to whitelist
    const whitelist = (repo.whitelistedDevelopers || []) as string[];
    if (!whitelist.includes(input.githubUsername)) {
      whitelist.push(input.githubUsername);

      await db
        .update(repositories)
        .set({ whitelistedDevelopers: whitelist })
        .where(eq(repositories.id, input.repositoryId));
    }

    return reply.code(200).send({
      success: true,
      message: 'Developer added to whitelist',
      data: { whitelist },
    });
  }

  /**
   * Remove developer from repository whitelist
   */
  async removeDeveloperFromWhitelist(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).userId;
    const input = removeDeveloperSchema.parse(request.body);

    // Verify repository belongs to user
    const repository = await db
      .select()
      .from(repositories)
      .where(and(eq(repositories.userId, userId), eq(repositories.id, input.repositoryId)))
      .limit(1);

    if (!repository.length) {
      throw new NotFoundError('Repository not found');
    }

    const repo = repository[0];

    // Remove developer from whitelist
    const whitelist = ((repo.whitelistedDevelopers || []) as string[]).filter(
      (dev) => dev !== input.githubUsername
    );

    await db
      .update(repositories)
      .set({ whitelistedDevelopers: whitelist })
      .where(eq(repositories.id, input.repositoryId));

    return reply.code(200).send({
      success: true,
      message: 'Developer removed from whitelist',
      data: { whitelist },
    });
  }

  /**
   * Update repository seat mode
   */
  async updateRepositorySeatMode(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).userId;
    const input = updateSeatModeSchema.parse(request.body);

    // Verify repository belongs to user
    const repository = await db
      .select()
      .from(repositories)
      .where(and(eq(repositories.userId, userId), eq(repositories.id, input.repositoryId)))
      .limit(1);

    if (!repository.length) {
      throw new NotFoundError('Repository not found');
    }

    // Update repository
    await db
      .update(repositories)
      .set({
        seatMode: input.mode,
        maxSeats: input.maxSeats || 1,
      })
      .where(eq(repositories.id, input.repositoryId));

    return reply.code(200).send({
      success: true,
      message: 'Repository seat mode updated',
      data: {
        seatMode: input.mode,
        maxSeats: input.maxSeats || 1,
      },
    });
  }

  /**
   * Get repository seat information
   */
  async getRepositorySeats(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).userId;
    const { repositoryId } = request.params as { repositoryId: string };

    // Verify repository belongs to user
    const repository = await db
      .select()
      .from(repositories)
      .where(and(eq(repositories.userId, userId), eq(repositories.id, repositoryId)))
      .limit(1);

    if (!repository.length) {
      throw new NotFoundError('Repository not found');
    }

    const currentMonth = new Date().toISOString().slice(0, 7);

    const seats = await db
      .select()
      .from(repositorySeats)
      .where(
        and(
          eq(repositorySeats.repositoryId, repositoryId),
          eq(repositorySeats.billingMonth, currentMonth)
        )
      );

    return reply.code(200).send({
      success: true,
      data: {
        repository: repository[0],
        seats,
        currentMonth,
      },
    });
  }
}

export const billingController = new BillingController();
