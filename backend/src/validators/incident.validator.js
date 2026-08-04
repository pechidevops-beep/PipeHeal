import { z } from 'zod';

export const createIncidentSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  description: z.string().optional().nullable(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('HIGH'),
  repositoryId: z.string().cuid('Invalid repository ID'),
  workflowRunId: z.string().cuid('Invalid workflow run ID').optional(),
  errorCategory: z.string().optional().nullable(),
  errorMessage: z.string().optional().nullable(),
  errorFile: z.string().optional().nullable(),
  errorLine: z.number().int().positive().optional().nullable(),
  errorCommand: z.string().optional().nullable(),
});

export const updateIncidentSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().optional().nullable(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z
    .enum(['OPEN', 'DIAGNOSING', 'PATCH_GENERATED', 'VERIFYING', 'RESOLVED', 'CLOSED'])
    .optional(),
  resolvedAt: z.string().datetime().optional().nullable(),
});

export const incidentIdSchema = z.object({
  id: z.string().cuid('Invalid incident ID'),
});
