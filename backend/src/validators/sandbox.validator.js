import { z } from 'zod';

export const runSandboxSchema = z.object({
  incidentId: z.string().cuid('Invalid incident ID'),
  patchId: z.string().cuid('Invalid patch ID').optional(),
  image: z.string().optional().default('node:20-alpine'),
  timeout: z.number().int().min(5000).max(300000).optional().default(120000),
});

export const sandboxIdSchema = z.object({
  id: z.string().cuid('Invalid sandbox run ID'),
});
