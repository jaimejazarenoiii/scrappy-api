import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { AdminAnalyticsController } from './admin-analytics.controller.js';
import { analyticsFilterQuerySchema } from './analytics.schemas.js';
import { z } from 'zod';

const adminAnalyticsCompanyParamsSchema = z.object({
  companyId: z.string().uuid(),
});

export function createAdminAnalyticsRoutes(controller: AdminAnalyticsController): Router {
  const router = Router();

  router.get(
    '/admin/analytics/overview',
    authorize(['SUPER_ADMIN']),
    validate(analyticsFilterQuerySchema, 'query'),
    controller.overview,
  );

  const scoped = [
    ['company', controller.company],
    ['transactions', controller.transactions],
    ['trips', controller.trips],
    ['expenses', controller.expenses],
    ['workforce', controller.workforce],
    ['organization', controller.organization],
  ] as const;

  for (const [segment, handler] of scoped) {
    router.get(
      `/admin/analytics/companies/:companyId/${segment}`,
      authorize(['SUPER_ADMIN']),
      validate(adminAnalyticsCompanyParamsSchema, 'params'),
      validate(analyticsFilterQuerySchema, 'query'),
      handler,
    );
  }

  return router;
}
