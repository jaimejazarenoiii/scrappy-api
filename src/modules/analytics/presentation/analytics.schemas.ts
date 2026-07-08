import { z } from 'zod';
import { ANALYTICS_PERIODS } from '../domain/analytics-period.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_RANGE_DAYS = 366;

export const analyticsFilterQuerySchema = z
  .object({
    period: z.enum(ANALYTICS_PERIODS).default('THIS_MONTH'),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    branchId: z.string().uuid().optional(),
    warehouseId: z.string().uuid().optional(),
    vehicleId: z.string().uuid().optional(),
    employeeId: z.string().uuid().optional(),
    includeArchived: z.coerce.boolean().default(false),
    limit: z.coerce.number().int().min(1).max(25).default(10),
  })
  .superRefine((value, ctx) => {
    if (value.period === 'CUSTOM') {
      if (!value.from) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'from is required when period is CUSTOM',
          path: ['from'],
        });
      }
      if (!value.to) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'to is required when period is CUSTOM',
          path: ['to'],
        });
      }
    }
    if (value.from && value.to && value.to < value.from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'to must be greater than or equal to from',
        path: ['to'],
      });
    }
    if (value.from && value.to) {
      const spanDays = (value.to.getTime() - value.from.getTime()) / MS_PER_DAY;
      if (spanDays > MAX_RANGE_DAYS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Date range cannot exceed ${MAX_RANGE_DAYS} days`,
          path: ['to'],
        });
      }
    }
  });

export type AnalyticsFilterQuery = z.infer<typeof analyticsFilterQuerySchema>;
