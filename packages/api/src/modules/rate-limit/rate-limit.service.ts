import { redis } from '../../config/redis.js';
import { PLANS, type PlanId } from '../../shared/constants/plans.js';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
  resetAt?: Date;
  planName?: string;
  error?: {
    code: string;
    message: string;
    upgradeUrl: string;
  };
}

export class RateLimitService {
  /**
   * Check if user has exceeded their monthly review limit
   */
  async checkLimit(userId: string, plan: PlanId): Promise<RateLimitResult> {
    const planConfig = PLANS[plan];
    const planLimits = planConfig.limits;
    const limit = planLimits.reviewsPerMonth;

    // Unlimited plans
    if (limit === -1 || limit >= 100000) {
      return {
        allowed: true,
        remaining: -1,
        limit: -1,
        used: 0,
        planName: planConfig.name,
      };
    }

    const currentMonth = this.getCurrentMonth();
    const key = `rate-limit:${userId}:${currentMonth}`;

    const currentUsage = await redis.get(key);
    const used = currentUsage ? parseInt(currentUsage) : 0;

    if (used >= limit) {
      return {
        allowed: false,
        remaining: 0,
        limit,
        used,
        planName: planConfig.name,
        resetAt: this.getNextMonthDate(),
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Monthly review limit (${limit}) exceeded for ${planConfig.name} plan. Upgrade your plan or wait until ${this.getNextMonthDate().toLocaleDateString()}.`,
          upgradeUrl: 'https://dashboard.mik-review.ai/upgrade',
        },
      };
    }

    return {
      allowed: true,
      remaining: limit - used,
      limit,
      used,
      planName: planConfig.name,
      resetAt: this.getNextMonthDate(),
    };
  }

  /**
   * Atomically consume a credit if allowed
   */
  async consume(userId: string, plan: PlanId): Promise<RateLimitResult> {
    const planConfig = PLANS[plan];
    const limit = planConfig.limits.reviewsPerMonth;

    if (limit === -1 || limit >= 100000) {
      return { allowed: true, remaining: -1, limit: -1, used: 0, planName: planConfig.name };
    }

    const currentMonth = this.getCurrentMonth();
    const key = `rate-limit:${userId}:${currentMonth}`;

    // Atomic increment
    const used = await redis.incr(key);

    // If this was the first increment, set expiry
    if (used === 1) {
      await redis.expire(key, this.getSecondsUntilEndOfMonth());
    }

    if (used > limit) {
      // If we exceeded, we should ideally not decrement back to avoid race condition 
      // where many people exceed and we stay at limit, 
      // but for monthly limits it's fine.
      return {
        allowed: false,
        remaining: 0,
        limit,
        used: used - 1, // Return what it was before this increment
        planName: planConfig.name,
        resetAt: this.getNextMonthDate(),
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Monthly review limit (${limit}) exceeded.`,
          upgradeUrl: 'https://dashboard.mik-review.ai/upgrade',
        },
      };
    }

    return {
      allowed: true,
      remaining: limit - used,
      limit,
      used,
      planName: planConfig.name,
      resetAt: this.getNextMonthDate(),
    };
  }

  /**
   * Increment usage counter for the current month
   */
  async incrementUsage(userId: string): Promise<void> {
    const currentMonth = this.getCurrentMonth();
    const key = `rate-limit:${userId}:${currentMonth}`;

    await redis.incr(key);

    // Set expiry for end of month (if not already set)
    const ttl = await redis.ttl(key);
    if (ttl === -1) {
      const secondsUntilEndOfMonth = this.getSecondsUntilEndOfMonth();
      await redis.expire(key, secondsUntilEndOfMonth);
    }
  }

  /**
   * Get current usage for a user
   */
  async getUsage(userId: string, plan: PlanId): Promise<RateLimitResult> {
    const planConfig = PLANS[plan];
    const limit = planConfig.limits.reviewsPerMonth;

    if (limit === -1 || limit >= 100000) {
      return {
        allowed: true,
        remaining: -1,
        limit: -1,
        used: 0,
        planName: planConfig.name,
      };
    }

    const currentMonth = this.getCurrentMonth();
    const key = `rate-limit:${userId}:${currentMonth}`;

    const currentUsage = await redis.get(key);
    const used = currentUsage ? parseInt(currentUsage) : 0;

    return {
      allowed: used < limit,
      remaining: Math.max(0, limit - used),
      limit,
      used,
      planName: planConfig.name,
      resetAt: this.getNextMonthDate(),
    };
  }

  /**
   * Get current month key (YYYY-MM)
   */
  private getCurrentMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Get first day of next month
   */
  private getNextMonthDate(): Date {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return nextMonth;
  }

  /**
   * Get seconds until end of current month
   */
  private getSecondsUntilEndOfMonth(): number {
    const now = new Date();
    const nextMonth = this.getNextMonthDate();
    const diff = nextMonth.getTime() - now.getTime();
    return Math.floor(diff / 1000);
  }
}
