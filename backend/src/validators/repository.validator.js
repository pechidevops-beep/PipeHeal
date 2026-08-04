import { z } from 'zod';

export const addRepositorySchema = z.object({
  fullName: z
    .string()
    .min(3, 'Full name required')
    .refine((v) => v.includes('/'), { message: 'Must be in owner/repo format' }),
  private: z.boolean().optional().default(false),
  defaultBranch: z.string().optional().default('main'),
  description: z.string().optional().nullable(),
  // Derived from fullName in service — optional in body
  owner: z.string().optional(),
  name: z.string().optional(),
});

export const repositoryIdSchema = z.object({
  id: z.string().min(1, 'Invalid repository ID'),
});
