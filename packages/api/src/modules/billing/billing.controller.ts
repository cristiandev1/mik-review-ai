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
import { eq, and } from 'drizzle-orm';
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
      .limit(1);

    return reply.code(200).send({
      success: true,
      data: {
        user: user[0],
        subscription: subscription[0] || null,
      },
    });
  }

  /**
   * Get monthly usage
   */
  async getUsage(request: FastifyRequest, reply: FastifyReply) {
    const userId = (request as any).userId;

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user.length) {
      throw new NotFoundError('User not found');
    }

    const currentMonth = new Date().toISOString().slice(0, 7);

    const usage = await db
      .select()
      .from(usageTracking)
      .where(and(eq(usageTracking.userId, userId), eq(usageTracking.billingMonth, currentMonth)));

    return reply.code(200).send({
      success: true,
      data: {
        user: user[0],
        usage,
        currentMonth,
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
    const { subscriptionId } = request.body as { subscriptionId: string };

    // Verify subscription belongs to user
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.stripeSubscriptionId, subscriptionId)))
      .limit(1);

    if (!subscription.length) {
      throw new NotFoundError('Subscription not found');
    }

    await billingService.cancelSubscription(subscriptionId);

    return reply.code(200).send({
      success: true,
      message: 'Subscription canceled successfully',
    });
  }

  /**
   * Handle Stripe webhook
   */
  async handleWebhook(request: FastifyRequest, reply: FastifyReply) {
    const signature = request.headers['stripe-signature'] as string;
    const body = (request as any).rawBody || JSON.stringify(request.body);

    const event = billingService.constructWebhookEvent(body, signature);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await billingService.handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await billingService.handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await billingService.handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await billingService.handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await billingService.handleInvoicePaymentFailed(event.data.object);
        break;
    }

    return reply.code(200).send({
      success: true,
      received: true,
    });
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
