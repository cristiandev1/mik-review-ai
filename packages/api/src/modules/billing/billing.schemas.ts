import { z } from 'zod';

export const createCheckoutSchema = z.object({
  plan: z.enum(['hobby', 'pro']),
  seats: z.number().min(1).max(100),
  repositoryId: z.string().optional(),
});

export const updateSeatsSchema = z.object({
  seats: z.number().min(1).max(100),
  subscriptionId: z.string(),
});

export const addDeveloperSchema = z.object({
  repositoryId: z.string(),
  githubUsername: z.string().min(1),
});

export const removeDeveloperSchema = z.object({
  repositoryId: z.string(),
  githubUsername: z.string().min(1),
});

export const updateSeatModeSchema = z.object({
  repositoryId: z.string(),
  mode: z.enum(['whitelist', 'auto-add']),
  maxSeats: z.number().min(1).optional(),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type UpdateSeatsInput = z.infer<typeof updateSeatsSchema>;
export type AddDeveloperInput = z.infer<typeof addDeveloperSchema>;
export type RemoveDeveloperInput = z.infer<typeof removeDeveloperSchema>;
export type UpdateSeatModeInput = z.infer<typeof updateSeatModeSchema>;
