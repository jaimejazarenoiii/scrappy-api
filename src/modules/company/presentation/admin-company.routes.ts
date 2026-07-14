import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { AdminCompanyController } from './admin-company.controller.js';
import {
  adminCompanyAccountParamsSchema,
  adminCompanyIdParamsSchema,
  adminCompanyListQuerySchema,
  adminCreateCompanyAccountSchema,
  adminCreateCompanySchema,
  adminResetCompanyAccountPasswordSchema,
} from './admin-company.schemas.js';

export function createAdminCompanyRoutes(controller: AdminCompanyController): Router {
  const router = Router();

  router.post(
    '/admin/companies',
    authorize(['SUPER_ADMIN']),
    validate(adminCreateCompanySchema),
    controller.create,
  );

  router.get(
    '/admin/companies',
    authorize(['SUPER_ADMIN']),
    validate(adminCompanyListQuerySchema, 'query'),
    controller.list,
  );

  router.get(
    '/admin/companies/:companyId',
    authorize(['SUPER_ADMIN']),
    validate(adminCompanyIdParamsSchema, 'params'),
    controller.getById,
  );

  router.get(
    '/admin/companies/:companyId/accounts',
    authorize(['SUPER_ADMIN']),
    validate(adminCompanyIdParamsSchema, 'params'),
    controller.listAccounts,
  );

  router.post(
    '/admin/companies/:companyId/accounts',
    authorize(['SUPER_ADMIN']),
    validate(adminCompanyIdParamsSchema, 'params'),
    validate(adminCreateCompanyAccountSchema),
    controller.createAccount,
  );

  router.post(
    '/admin/companies/:companyId/accounts/:userId/password-reset',
    authorize(['SUPER_ADMIN']),
    validate(adminCompanyAccountParamsSchema, 'params'),
    validate(adminResetCompanyAccountPasswordSchema),
    controller.resetAccountPassword,
  );

  return router;
}
