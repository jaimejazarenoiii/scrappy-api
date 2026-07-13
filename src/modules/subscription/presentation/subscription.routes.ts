import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { SubscriptionController } from './subscription.controller.js';
import {
  adminCompanyIdParamsSchema,
  adminSubscriptionParamsSchema,
  createSubscriptionSchema,
  expireSubscriptionSchema,
  renewSubscriptionSchema,
  subscriptionHistoryQuerySchema,
  suspendCompanySchema,
} from './subscription.schemas.js';

const ALL_TENANT_ROLES = ['OWNER', 'MANAGER', 'EMPLOYEE', 'SUPER_ADMIN'] as const;

export function createAdminSubscriptionRoutes(controller: SubscriptionController): Router {
  const router = Router();

  router.get(
    '/admin/companies/:companyId/subscriptions',
    authorize(['SUPER_ADMIN']),
    validate(adminCompanyIdParamsSchema, 'params'),
    validate(subscriptionHistoryQuerySchema, 'query'),
    controller.listHistory,
  );

  router.post(
    '/admin/companies/:companyId/subscriptions',
    authorize(['SUPER_ADMIN']),
    validate(adminCompanyIdParamsSchema, 'params'),
    validate(createSubscriptionSchema),
    controller.create,
  );

  router.post(
    '/admin/companies/:companyId/subscriptions/renew',
    authorize(['SUPER_ADMIN']),
    validate(adminCompanyIdParamsSchema, 'params'),
    validate(renewSubscriptionSchema),
    controller.renew,
  );

  router.post(
    '/admin/companies/:companyId/subscriptions/expire',
    authorize(['SUPER_ADMIN']),
    validate(adminCompanyIdParamsSchema, 'params'),
    validate(expireSubscriptionSchema),
    controller.expire,
  );

  router.post(
    '/admin/companies/:companyId/subscriptions/suspend',
    authorize(['SUPER_ADMIN']),
    validate(adminCompanyIdParamsSchema, 'params'),
    validate(suspendCompanySchema),
    controller.suspend,
  );

  router.get(
    '/admin/companies/:companyId/subscriptions/:subscriptionId',
    authorize(['SUPER_ADMIN']),
    validate(adminSubscriptionParamsSchema, 'params'),
    controller.getById,
  );

  router.get(
    '/admin/companies/:companyId/subscription-status',
    authorize(['SUPER_ADMIN']),
    validate(adminCompanyIdParamsSchema, 'params'),
    controller.getAdminStatus,
  );

  return router;
}

export function createTenantSubscriptionRoutes(controller: SubscriptionController): Router {
  const router = Router();
  router.get(
    '/companies/me/subscription-status',
    authorize([...ALL_TENANT_ROLES]),
    controller.getMyStatus,
  );
  return router;
}
