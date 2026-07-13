import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { AdminCompanyController } from './admin-company.controller.js';
import {
  adminCompanyIdParamsSchema,
  adminCompanyListQuerySchema,
  adminCreateCompanyAccountSchema,
  adminCreateCompanySchema,
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

  router.post(
    '/admin/companies/:companyId/accounts',
    authorize(['SUPER_ADMIN']),
    validate(adminCompanyIdParamsSchema, 'params'),
    validate(adminCreateCompanyAccountSchema),
    controller.createAccount,
  );

  return router;
}
