import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import {
  createEmployeeSchema,
  employeeIdParamsSchema,
  linkEmployeeUserSchema,
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
  return router;
}
