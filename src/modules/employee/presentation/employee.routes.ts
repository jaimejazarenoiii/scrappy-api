import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import {
  createEmployeeSchema,
  employeeIdParamsSchema,
  grantSystemAccessSchema,
  linkEmployeeUserSchema,
  resetEmployeePasswordSchema,
  updateEmployeeSchema,
} from './employee.schemas.js';
import type { EmployeeController } from './employee.controller.js';

export function createEmployeeRoutes(controller: EmployeeController): Router {
  const router = Router();
  router.get('/employees/me', authorize(['OWNER', 'MANAGER', 'EMPLOYEE']), controller.me);
  router.get('/employees', authorize(['OWNER', 'MANAGER', 'EMPLOYEE']), controller.list);
  router.post(
    '/employees',
    authorize(['OWNER', 'MANAGER']),
    validate(createEmployeeSchema),
    controller.create,
  );
  router.get(
    '/employees/:employeeId',
    authorize(['OWNER', 'MANAGER']),
    validate(employeeIdParamsSchema, 'params'),
    controller.getById,
  );
  router.patch(
    '/employees/:employeeId',
    authorize(['OWNER', 'MANAGER']),
    validate(employeeIdParamsSchema, 'params'),
    validate(updateEmployeeSchema),
    controller.update,
  );
  router.post(
    '/employees/:employeeId/archive',
    authorize(['OWNER', 'MANAGER']),
    validate(employeeIdParamsSchema, 'params'),
    controller.archive,
  );
  router.post(
    '/employees/:employeeId/user-link',
    authorize(['OWNER', 'MANAGER']),
    validate(employeeIdParamsSchema, 'params'),
    validate(linkEmployeeUserSchema),
    controller.linkUser,
  );
  router.post(
    '/employees/:employeeId/system-access',
    authorize(['OWNER', 'MANAGER']),
    validate(employeeIdParamsSchema, 'params'),
    validate(grantSystemAccessSchema),
    controller.grantSystemAccess,
  );
  router.post(
    '/employees/:employeeId/system-access/disable',
    authorize(['OWNER', 'MANAGER']),
    validate(employeeIdParamsSchema, 'params'),
    controller.disableSystemAccess,
  );
  router.post(
    '/employees/:employeeId/system-access/enable',
    authorize(['OWNER', 'MANAGER']),
    validate(employeeIdParamsSchema, 'params'),
    controller.enableSystemAccess,
  );
  router.post(
    '/employees/:employeeId/password-reset',
    authorize(['OWNER', 'MANAGER']),
    validate(employeeIdParamsSchema, 'params'),
    validate(resetEmployeePasswordSchema),
    controller.resetPassword,
  );
  return router;
}
