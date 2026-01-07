/**
 * Pricing Plans - Updated with Stripe Integration
 *
 * Free (Trial): 3 reviews total (lifetime) - $0
 *   - After 3 reviews, upgrade to paid plan required
 *   - Via requiresPayment flag in users table
 *
 * Hobby: 15 reviews/month per seat - $5/month
 *   - Monthly billing cycle
 *   - Per-seat based on developers
 *
 * Pro: 100 reviews/month per seat - $15/month
 *   - Monthly billing cycle
 *   - Per-seat based on developers
 */
export const PLANS = {
  trial: {
    id: 'trial',
    name: 'Free Trial',
    price: 0,
    currency: 'USD',
    billingCycle: 'one-time',
    limits: {
      reviewsPerMonth: 3, // Total lifetime, not monthly
      repositories: -1, // unlimited
      teamMembers: 1,
      customRules: true,
      analytics: 'basic',
      aiModels: ['deepseek'],
      support: 'community',
      seatMode: 'none',
    },
    features: {
      whitelistMode: false,
      autoAddMode: false,
      advancedAnalytics: false,
      prioritySupport: false,
      apiAccess: false,
    },
  },
  hobby: {
    id: 'hobby',
    name: 'Hobby',
    price: 500, // $5.00 in cents
    currency: 'USD',
    billingCycle: 'monthly',
    limits: {
      reviewsPerMonth: 15, // Per seat
      repositories: -1, // unlimited
      teamMembers: -1, // unlimited via seats
      customRules: true,
      analytics: 'advanced',
      aiModels: ['deepseek'],
      support: 'email',
      seatMode: 'per-seat', // charged per developer
    },
    features: {
      whitelistMode: true,
      autoAddMode: true,
      advancedAnalytics: true,
      prioritySupport: false,
      apiAccess: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 1500, // $15.00 in cents
    currency: 'USD',
    billingCycle: 'monthly',
    limits: {
      reviewsPerMonth: 100, // Per seat
      repositories: -1, // unlimited
      teamMembers: -1, // unlimited via seats
      customRules: true,
      analytics: 'premium',
      aiModels: ['deepseek'],
      support: 'priority',
      seatMode: 'per-seat', // charged per developer
    },
    features: {
      whitelistMode: true,
      autoAddMode: true,
      advancedAnalytics: true,
      prioritySupport: true,
      apiAccess: true,
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;

/**
 * Helper function to get reviews limit based on plan and seats
 */
export function getReviewsLimit(planId: PlanId, seats: number = 1): number {
  const plan = PLANS[planId];

  if (planId === 'trial') {
    // Trial is always 3 total, not monthly
    return 3;
  }

  // Hobby and Pro scale with seats
  return plan.limits.reviewsPerMonth * seats;
}
