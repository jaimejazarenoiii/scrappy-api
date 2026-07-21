import { z } from 'zod';

export const latitudeSchema = z.number().min(-90).max(90);

export const longitudeSchema = z.number().min(-180).max(180);

export const headingSchema = z.number().min(0).max(360);

export const batteryLevelSchema = z.number().int().min(0).max(100);

const MAX_FUTURE_SKEW_MS = 2 * 60 * 1000;

/**
 * Validates an ISO datetime capture timestamp is not unreasonably far in the future.
 */
export const capturedAtSchema = z
  .string()
  .datetime()
  .refine(
    (value) => {
      const captured = new Date(value).getTime();
      return captured <= Date.now() + MAX_FUTURE_SKEW_MS;
    },
    { message: 'Capture timestamp cannot be far in the future' },
  );
