import { redis } from '../../config/redis.js';
import { PLANS, type PlanId } from '../../shared/constants/plans.js';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
  resetAt?: Date;
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
    const planLimits = PLANS[plan].limits;
    const limit = planLimits.reviewsPerMonth;

    // Unlimited plans (if limit is -1 or very high number)
    if (limit === -1 || limit >= 100000) {
      return {
        allowed: true,
        remaining: -1,
        limit: -1,
        used: 0,
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
        resetAt: this.getNextMonthDate(),
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Monthly review limit (${limit}) exceeded. Upgrade your plan or wait until ${this.getNextMonthDate().toLocaleDateString()}.`,
          upgradeUrl: 'https://dashboard.mik-review.ai/upgrade',
        },
      };
    }

    return {
      allowed: true,
      remaining: limit - used,
      limit,
      used,
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
    const planLimits = PLANS[plan].limits;
    const limit = planLimits.reviewsPerMonth;

    if (limit === -1 || limit >= 100000) {
      return {
        allowed: true,
        remaining: -1,
        limit: -1,
        used: 0,
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
