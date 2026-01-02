import { z } from 'zod';

// Create custom rule schema
export const createCustomRuleSchema = z.object({
  name: z.string().min(1).max(255),
  content: z.string().min(1),
  repository: z.string().optional(), // e.g., "owner/repo" - if null, rule is global
  teamId: z.string().optional(), // if provided, rule belongs to team
});

export type CreateCustomRuleInput = z.infer<typeof createCustomRuleSchema>;

// Update custom rule schema
export const updateCustomRuleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  repository: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCustomRuleInput = z.infer<typeof updateCustomRuleSchema>;

// List custom rules query params
export const listCustomRulesSchema = z.object({
  repository: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export type ListCustomRulesInput = z.infer<typeof listCustomRulesSchema>;
