import { z } from 'zod';

export const createReviewSchema = z.object({
  repository: z.string().min(1, 'Repository is required').regex(/^[\w-]+\/[\w-]+$/, 'Invalid repository format (owner/repo)'),
  pullRequest: z.number().int().positive('Pull request number must be positive'),
  githubToken: z.string().optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
