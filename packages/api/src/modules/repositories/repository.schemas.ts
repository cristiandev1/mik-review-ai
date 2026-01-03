import { z } from 'zod';

// Schema for syncing a repository
export const syncRepositorySchema = z.object({
  githubRepoId: z.number(),
  fullName: z.string(),
  name: z.string(),
  owner: z.string(),
  description: z.string().nullable().optional(),
  isPrivate: z.boolean().default(false),
  defaultBranch: z.string().default('main'),
  language: z.string().nullable().optional(),
});

// Schema for updating repository status
export const updateRepositorySchema = z.object({
  isEnabled: z.boolean(),
});

// Schema for query params
export const listRepositoriesQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  isEnabled: z.string().optional(),
});

export type SyncRepositoryInput = z.infer<typeof syncRepositorySchema>;
export type UpdateRepositoryInput = z.infer<typeof updateRepositorySchema>;
export type ListRepositoriesQuery = z.infer<typeof listRepositoriesQuerySchema>;
