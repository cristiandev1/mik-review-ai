import { pgTable, varchar, timestamp, integer, boolean, json, text, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users Table
export const users = pgTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }),
  name: varchar('name', { length: 255 }),
  plan: varchar('plan', { length: 50 }).default('free').notNull(), // free, pro, business
  githubId: varchar('github_id', { length: 100 }).unique(),
  githubAccessToken: varchar('github_access_token', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  emailVerified: boolean('email_verified').default(false).notNull(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 100 }),
  trialPrsUsed: integer('trial_prs_used').default(0).notNull(),
  trialTokensUsed: integer('trial_tokens_used').default(0).notNull(),
  trialExpired: boolean('trial_expired').default(false).notNull(),
  trialExpiresAt: timestamp('trial_expires_at'),
  requiresPayment: boolean('requires_payment').default(false).notNull(),
  currentPlan: varchar('current_plan', { length: 20 }).default('trial').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// API Keys Table
export const apiKeys = pgTable('api_keys', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
  key: varchar('key', { length: 64 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Reviews Table
export const reviews = pgTable('reviews', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
  repository: varchar('repository', { length: 255 }).notNull(),
  pullRequest: integer('pull_request').notNull(),
  status: varchar('status', { length: 50 }).notNull(), // processing, completed, failed
  summary: text('summary'),
  comments: json('comments').$type<Array<{
    file: string;
    lineNumber: string;
    comment: string;
  }>>(),
  aiModel: varchar('ai_model', { length: 50 }),
  tokensUsed: integer('tokens_used'),
  processingTime: integer('processing_time'), // milliseconds
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Usage Analytics Table
export const usageAnalytics = pgTable('usage_analytics', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp('date').notNull(),
  reviewsCount: integer('reviews_count').default(0).notNull(),
  tokensUsed: integer('tokens_used').default(0).notNull(),
  avgProcessingTime: integer('avg_processing_time').default(0).notNull(),
  repositories: json('repositories').$type<string[]>(),
});

// Teams Table
export const teams = pgTable('teams', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  ownerId: varchar('owner_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
  plan: varchar('plan', { length: 50 }).default('free').notNull(),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Team Members Table
export const teamMembers = pgTable('team_members', {
  id: varchar('id', { length: 36 }).primaryKey(),
  teamId: varchar('team_id', { length: 36 }).references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 50 }).default('member').notNull(), // owner, admin, member
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

// Custom Rules Table
export const customRules = pgTable('custom_rules', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }),
  teamId: varchar('team_id', { length: 36 }).references(() => teams.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  repository: varchar('repository', { length: 255 }), // null = global rules
  content: text('content').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Subscriptions Table
export const subscriptions = pgTable('subscriptions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }),
  teamId: varchar('team_id', { length: 36 }).references(() => teams.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 100 }).unique(),
  stripePriceId: varchar('stripe_price_id', { length: 100 }),
  status: varchar('status', { length: 50 }), // active, canceled, past_due
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  canceledAt: timestamp('canceled_at'),
  seatsPurchased: integer('seats_purchased').default(1).notNull(),
  seatsUsed: integer('seats_used').default(0).notNull(),
  meteredItemId: varchar('metered_item_id', { length: 255 }),
  billingCycleAnchor: timestamp('billing_cycle_anchor'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Email Verification Tokens Table
export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: varchar('token', { length: 64 }).unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Password Reset Tokens Table
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: varchar('token', { length: 64 }).unique().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Repositories Table
export const repositories = pgTable('repositories', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
  githubRepoId: integer('github_repo_id').notNull(), // GitHub repository ID
  fullName: varchar('full_name', { length: 255 }).notNull(), // owner/repo-name
  name: varchar('name', { length: 255 }).notNull(),
  owner: varchar('owner', { length: 255 }).notNull(),
  description: text('description'),
  isPrivate: boolean('is_private').default(false).notNull(),
  isEnabled: boolean('is_enabled').default(true).notNull(),
  allowedUsernames: json('allowed_usernames').$type<string[]>(), // Whitelisted users for this repo
  excludedFilePatterns: json('excluded_file_patterns').$type<string[]>(), // File patterns to exclude from AI review
  githubWebhookId: integer('github_webhook_id'), // Webhook ID for auto-review
  defaultBranch: varchar('default_branch', { length: 100 }).default('main'),
  language: varchar('language', { length: 50 }),
  seatMode: varchar('seat_mode', { length: 20 }).default('auto-add').notNull(),
  maxSeats: integer('max_seats').default(1).notNull(),
  whitelistedDevelopers: jsonb('whitelisted_developers').$type<string[]>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Repository Seats Table
export const repositorySeats = pgTable('repository_seats', {
  id: varchar('id', { length: 36 }).primaryKey(),
  repositoryId: varchar('repository_id', { length: 36 }).references(() => repositories.id, { onDelete: 'cascade' }).notNull(),
  developerGithubUsername: varchar('developer_github_username', { length: 255 }).notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  billingMonth: varchar('billing_month', { length: 7 }).notNull(),
});

// Usage Tracking Table
export const usageTracking = pgTable('usage_tracking', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
  repositoryId: varchar('repository_id', { length: 36 }).references(() => repositories.id, { onDelete: 'cascade' }).notNull(),
  developerGithubUsername: varchar('developer_github_username', { length: 255 }).notNull(),
  prsProcessed: integer('prs_processed').default(0).notNull(),
  tokensConsumed: integer('tokens_consumed').default(0).notNull(),
  billingMonth: varchar('billing_month', { length: 7 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  apiKeys: many(apiKeys),
  reviews: many(reviews),
  analytics: many(usageAnalytics),
  ownedTeams: many(teams),
  teamMemberships: many(teamMembers),
  customRules: many(customRules),
  subscriptions: many(subscriptions),
  verificationTokens: many(emailVerificationTokens),
  passwordResetTokens: many(passwordResetTokens),
  repositories: many(repositories),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, {
    fields: [teams.ownerId],
    references: [users.id],
  }),
  members: many(teamMembers),
  customRules: many(customRules),
  subscriptions: many(subscriptions),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const repositoriesRelations = relations(repositories, ({ one, many }) => ({
  user: one(users, {
    fields: [repositories.userId],
    references: [users.id],
  }),
  seats: many(repositorySeats),
  usageTracking: many(usageTracking),
}));

export const repositorySeatsRelations = relations(repositorySeats, ({ one }) => ({
  repository: one(repositories, {
    fields: [repositorySeats.repositoryId],
    references: [repositories.id],
  }),
}));

export const usageTrackingRelations = relations(usageTracking, ({ one }) => ({
  user: one(users, {
    fields: [usageTracking.userId],
    references: [users.id],
  }),
  repository: one(repositories, {
    fields: [usageTracking.repositoryId],
    references: [repositories.id],
  }),
}));
