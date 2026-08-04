import { z } from 'zod';

export const diagnoseSchema = z.object({
  workflowRunId: z.string().cuid('Invalid workflow run ID'),
});

export const generateFixSchema = z.object({
  incidentId: z.string().cuid('Invalid incident ID'),
  diagnosisId: z.string().cuid('Invalid diagnosis ID').optional(),
  filePath: z.string().optional(),
  originalCode: z.string().optional(),
});
