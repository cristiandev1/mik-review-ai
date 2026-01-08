import Stripe from 'stripe';
import { db } from '../../config/database.js';
import { users, subscriptions } from '../../database/schema.js';
import { eq } from 'drizzle-orm';
import { env } from '../../config/env.js';
import { nanoid } from 'nanoid';
import { NotFoundError, AppError } from '../../shared/errors/app-error.js';
import { logger } from '../../shared/utils/logger.js';

export class BillingService {
  private stripe: Stripe;

  constructor() {
    if (!env.STRIPE_SECRET_KEY) {
      throw new AppError('STRIPE_SECRET_KEY is not configured', 500);
    }
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia' as any,
    });
  }

  /**
   * Create a checkout session for new subscriptions
   */
  async createCheckoutSession(userId: string, plan: 'hobby' | 'pro', seats: number) {
    // Get user from database
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userRecord.length) {
      throw new NotFoundError('User not found');
    }

    const user = userRecord[0];
    let stripeCustomerId = user.stripeCustomerId;

    // Create or get Stripe customer
    if (!stripeCustomerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: {
          userId,
        },
      });
      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await db
        .update(users)
        .set({ stripeCustomerId: customer.id })
        .where(eq(users.id, userId));
    }

    // Get price ID from environment
    const priceId = plan === 'pro' ? env.STRIPE_PRO_PRICE_ID : env.STRIPE_HOBBY_PRICE_ID;

    // Create checkout session
    const session = await this.stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: seats,
        },
      ],
      mode: 'subscription',
      success_url: `${env.FRONTEND_URL}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.FRONTEND_URL}/dashboard/billing`,
      metadata: {
        userId,
        plan,
        seats: seats.toString(),
      },
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Create a subscription from Stripe
   */
  async createSubscription(
    userId: string,
    stripeSubscriptionId: string,
    stripePriceId: string,
    seats: number
  ) {
    const subscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);

    // Find metered item
    let meteredItemId: string | undefined;
    if (subscription.items.data[0]) {
      meteredItemId = subscription.items.data[0].id;
    }

    // Create subscription record
    await db.insert(subscriptions).values({
      id: nanoid(),
      userId,
      stripeSubscriptionId,
      stripePriceId,
      status: subscription.status as string,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      seatsPurchased: seats,
      seatsUsed: 0,
      meteredItemId,
      billingCycleAnchor: new Date(subscription.billing_cycle_anchor * 1000),
    });

    // Update user plan
    await db
      .update(users)
      .set({
        currentPlan: stripePriceId.includes('pro') ? 'pro' : 'hobby',
        requiresPayment: false,
      })
      .where(eq(users.id, userId));
  }

  /**
   * Update subscription seats
   */
  async updateSubscriptionSeats(subscriptionId: string, newSeats: number) {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);

    if (!subscription.items.data[0]) {
      throw new AppError('No subscription items found', 400);
    }

    // Update the subscription item quantity
    await this.stripe.subscriptionItems.update(subscription.items.data[0].id, {
      quantity: newSeats,
    });

    // Update database
    const dbSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
      .limit(1);

    if (dbSubscription.length > 0) {
      await db
        .update(subscriptions)
        .set({
          seatsPurchased: newSeats,
        })
        .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string) {
    // Update subscription to cancel at period end instead of immediate cancellation
    const subscription = await (this.stripe.subscriptions as any).update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Update database
    await db
      .update(subscriptions)
      .set({
        status: subscription.status,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
  }

  /**
   * Report usage to Stripe for metered billing
   */
  async reportUsage(subscriptionId: string, meteredItemId: string, quantity: number) {
    try {
      await this.stripe.usageRecords.create(meteredItemId, {
        quantity,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment',
      });
    } catch (error) {
      logger.error('Error reporting usage to Stripe', { error, subscriptionId, quantity });
      throw error;
    }
  }

  /**
   * Get customer details
   */
  async getCustomer(customerId: string) {
    return this.stripe.customers.retrieve(customerId);
  }

  /**
   * Get subscription details
   */
  async getSubscription(subscriptionId: string) {
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  /**
   * Construct webhook event with signature verification
   */
  constructWebhookEvent(body: string, signature: string) {
    try {
      if (!env.STRIPE_WEBHOOK_SECRET) {
        throw new AppError('STRIPE_WEBHOOK_SECRET is not configured', 500);
      }
      return this.stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
      logger.error('Webhook signature verification failed', { error });
      throw new AppError('Webhook signature verification failed', 401);
    }
  }

  /**
   * Sync subscription status from Stripe to database
   */
  async syncSubscriptionStatus(stripeSubscriptionId: string) {
    const stripeSubscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);

    await db
      .update(subscriptions)
      .set({
        status: stripeSubscription.status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        canceledAt: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null,
      })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
  }

  /**
   * Handle checkout session completion
   */
  async handleCheckoutCompleted(session: any) {
    if (!session.customer || typeof session.customer !== 'string') {
      throw new AppError('Invalid customer ID in checkout session', 400);
    }

    if (!session.subscription || typeof session.subscription !== 'string') {
      throw new AppError('No subscription in checkout session', 400);
    }

    const userId = session.metadata?.userId;
    if (!userId) {
      throw new AppError('No user ID in session metadata', 400);
    }

    const seats = parseInt(session.metadata?.seats || '1');

    // Get subscription details
    const subscription = await this.stripe.subscriptions.retrieve(session.subscription as string);

    // Create subscription in database
    const stripePriceId = subscription.items.data[0]?.price.id || '';
    await this.createSubscription(userId, session.subscription as string, stripePriceId, seats);
  }

  /**
   * Handle subscription updated event
   */
  async handleSubscriptionUpdated(stripeSubscription: any) {
    await this.syncSubscriptionStatus(stripeSubscription.id);
  }

  /**
   * Handle subscription deleted event
   */
  async handleSubscriptionDeleted(stripeSubscription: any) {
    const dbSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id))
      .limit(1);

    if (dbSubscription.length > 0) {
      const userId = dbSubscription[0].userId;
      if (userId) {
        // Update user plan to trial
        await db
          .update(users)
          .set({
            currentPlan: 'trial',
            requiresPayment: false,
          })
          .where(eq(users.id, userId));
      }
    }

    // Mark subscription as canceled
    await db
      .update(subscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id));
  }

  /**
   * Handle invoice payment succeeded
   */
  async handleInvoicePaymentSucceeded(invoice: any) {
    if (!invoice.subscription || typeof invoice.subscription !== 'string') {
      return;
    }

    await this.syncSubscriptionStatus(invoice.subscription);
  }

  /**
   * Handle invoice payment failed
   */
  async handleInvoicePaymentFailed(invoice: any) {
    if (!invoice.subscription || typeof invoice.subscription !== 'string') {
      return;
    }

    // Mark subscription as past_due
    await db
      .update(subscriptions)
      .set({
        status: 'past_due',
      })
      .where(eq(subscriptions.stripeSubscriptionId, invoice.subscription));
  }
}

export const billingService = new BillingService();
