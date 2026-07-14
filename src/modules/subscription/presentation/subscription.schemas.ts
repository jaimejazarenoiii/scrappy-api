import { z } from 'zod';
import { COMPANY_SUBSCRIPTION_STATUSES } from '../domain/company-subscription-status.js';

export const adminCompanyIdParamsSchema = z.object({
  companyId: z.string().uuid(),
});

export const adminSubscriptionParamsSchema = adminCompanyIdParamsSchema.extend({
  subscriptionId: z.string().uuid(),
});

export const subscriptionHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const dateRangeRefine = (data: { startsAt: Date; endsAt: Date }, ctx: z.RefinementCtx) => {
  if (data.startsAt > data.endsAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'startsAt must be before or equal to endsAt',
      path: ['startsAt'],
    });
  }
};

export const createSubscriptionSchema = z
  .object({
    planName: z.string().trim().min(1).max(120),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    status: z.enum(['PENDING', 'ACTIVE']),
    companyStatus: z.enum(COMPANY_SUBSCRIPTION_STATUSES).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .superRefine(dateRangeRefine);

export const renewSubscriptionSchema = z
  .object({
    planName: z.string().trim().min(1).max(120),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    status: z.enum(['PENDING', 'ACTIVE']).default('ACTIVE'),
    companyStatus: z.enum(COMPANY_SUBSCRIPTION_STATUSES).optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .superRefine(dateRangeRefine);

export const expireSubscriptionSchema = z
  .object({
    notes: z.string().trim().max(2000).optional(),
  })
  .default({});

export const suspendCompanySchema = z
  .object({
    notes: z.string().trim().max(2000).optional(),
  })
  .default({});

export const updateSubscriptionSchema = z
  .object({
    planName: z.string().trim().min(1).max(120).optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    status: z.enum(['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED']).optional(),
    companyStatus: z.enum(COMPANY_SUBSCRIPTION_STATUSES).optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .refine(
    (value) =>
      value.planName !== undefined ||
      value.startsAt !== undefined ||
      value.endsAt !== undefined ||
      value.status !== undefined ||
      value.companyStatus !== undefined ||
      value.notes !== undefined,
    { message: 'At least one field is required' },
  )
  .superRefine((data, ctx) => {
    if (data.startsAt && data.endsAt && data.startsAt > data.endsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'startsAt must be before or equal to endsAt',
        path: ['startsAt'],
      });
    }
  });

export type SubscriptionHistoryQuery = z.infer<typeof subscriptionHistoryQuerySchema>;
