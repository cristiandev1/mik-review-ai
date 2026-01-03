import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(3).max(50),
});

export const updateTeamSchema = z.object({
  name: z.string().min(3).max(50).optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member']),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
