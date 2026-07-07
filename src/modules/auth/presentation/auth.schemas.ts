import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().email(),
  password: z.string().min(8),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().email(),
});
