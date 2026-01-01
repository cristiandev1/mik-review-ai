export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    limits: {
      reviewsPerMonth: 10 as number,
      repositories: 1,
      teamMembers: 1,
      customRules: false,
      analytics: 'basic',
      aiModels: ['deepseek'],
      support: 'community',
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: null, // TBD
    limits: {
      reviewsPerMonth: 1000 as number,
      repositories: -1, // unlimited
      teamMembers: 1,
      customRules: true,
      analytics: 'advanced',
      aiModels: ['deepseek', 'gpt-4', 'claude'],
      support: 'email',
    },
  },
  business: {
    id: 'business',
    name: 'Business',
    price: null, // TBD
    limits: {
      reviewsPerMonth: 10000 as number,
      repositories: -1, // unlimited
      teamMembers: 50,
      customRules: true,
      analytics: 'premium',
      aiModels: ['deepseek', 'gpt-4', 'claude', 'custom'],
      support: 'priority',
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;
