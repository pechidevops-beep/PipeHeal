import { z } from 'zod';

export const loginSchema = z.object({
  code: z.string().min(1, 'GitHub OAuth code is required'),
  state: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
