import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { AnalyticsController } from './analytics.controller.js';
import { analyticsFilterQuerySchema } from './analytics.schemas.js';

const MANAGER_ROLES = ['OWNER', 'MANAGER'] as const;

export function createAnalyticsRoutes(controller: AnalyticsController): Router {
  const router = Router();

  router.get(
    '/analytics/company',
    authorize([...MANAGER_ROLES]),
    validate(analyticsFilterQuerySchema, 'query'),
    controller.getCompany,
  );

  router.get(
    '/analytics/transactions',
    authorize([...MANAGER_ROLES]),
    validate(analyticsFilterQuerySchema, 'query'),
    controller.getTransactions,
  );

  router.get(
    '/analytics/trips',
    authorize([...MANAGER_ROLES]),
    validate(analyticsFilterQuerySchema, 'query'),
    controller.getTrips,
  );

  router.get(
    '/analytics/expenses',
    authorize([...MANAGER_ROLES]),
    validate(analyticsFilterQuerySchema, 'query'),
    controller.getExpenses,
  );

  router.get(
    '/analytics/workforce',
    authorize([...MANAGER_ROLES]),
    validate(analyticsFilterQuerySchema, 'query'),
    controller.getWorkforce,
  );

  router.get(
    '/analytics/organization',
    authorize([...MANAGER_ROLES]),
    validate(analyticsFilterQuerySchema, 'query'),
    controller.getOrganization,
  );

  return router;
}
