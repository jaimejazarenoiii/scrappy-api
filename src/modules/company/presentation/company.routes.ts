import type { RequestHandler } from 'express';
import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import {
  companyIdParamsSchema,
  createCompanySchema,
  updateCompanySchema,
} from './company.schemas.js';
import type { CompanyController } from './company.controller.js';

export function createCompanyRoutes(
  controller: CompanyController,
  authenticationMiddleware: RequestHandler,
): Router {
  const router = Router();
  router.post('/companies', validate(createCompanySchema), controller.create);
  router.get(
    '/companies/me',
    authenticationMiddleware,
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    controller.getMine,
  );
  router.get(
    '/companies/:companyId',
    authenticationMiddleware,
    validate(companyIdParamsSchema, 'params'),
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    controller.getById,
  );
  router.patch(
    '/companies/:companyId',
    authenticationMiddleware,
    validate(companyIdParamsSchema, 'params'),
    authorize(['OWNER']),
    validate(updateCompanySchema),
    controller.update,
  );
  router.post(
    '/companies/:companyId/archive',
    authenticationMiddleware,
    validate(companyIdParamsSchema, 'params'),
    authorize(['OWNER']),
    controller.archive,
  );
  return router;
}
