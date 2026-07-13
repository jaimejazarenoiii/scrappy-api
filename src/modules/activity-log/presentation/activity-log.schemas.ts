import { z } from 'zod';
import { ACTIVITY_EVENT_TYPES, ACTIVITY_MODULES } from '../domain/activity-actions.js';

export const activityLogIdParamsSchema = z.object({
  activityLogId: z.string().uuid(),
});

const searchBySchema = z.enum([
  'employeeName',
  'transactionNumber',
  'tripNumber',
  'expenseNumber',
  'user',
  'action',
]);

export const activityLogListQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z.enum(['createdAt', 'module', 'user']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
    q: z.string().trim().min(1).max(200).optional(),
    searchBy: searchBySchema.optional(),
    module: z.enum(ACTIVITY_MODULES).optional(),
    action: z.string().trim().min(1).max(200).optional(),
    userId: z.string().uuid().optional(),
    eventType: z.enum(ACTIVITY_EVENT_TYPES).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.q && !data.searchBy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'searchBy is required when q is provided',
        path: ['searchBy'],
      });
    }
    if (data.dateFrom && data.dateTo && data.dateFrom > data.dateTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dateFrom must be before or equal to dateTo',
        path: ['dateFrom'],
      });
    }
  });

export type ActivityLogListQuery = z.infer<typeof activityLogListQuerySchema>;
