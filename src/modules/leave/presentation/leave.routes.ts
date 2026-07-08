import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { LeaveController } from './leave.controller.js';
import {
  leaveDashboardQuerySchema,
  leaveIdParamsSchema,
  listLeaveQuerySchema,
  manageLeaveSchema,
  requestLeaveSchema,
} from './leave.schemas.js';

export function createLeaveRoutes(controller: LeaveController): Router {
  const router = Router();

  router.post(
    '/workforce/leave',
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    validate(requestLeaveSchema),
    controller.request,
  );
  router.get(
    '/workforce/leave',
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    validate(listLeaveQuerySchema, 'query'),
    controller.listMine,
  );
  router.get(
    '/workforce/leave/company',
    authorize(['OWNER', 'MANAGER']),
    validate(listLeaveQuerySchema, 'query'),
    controller.listCompany,
  );
  router.get(
    '/workforce/leave/dashboard',
    authorize(['OWNER', 'MANAGER']),
    validate(leaveDashboardQuerySchema, 'query'),
    controller.dashboard,
  );
  router.patch(
    '/workforce/leave/:leaveId',
    authorize(['OWNER', 'MANAGER']),
    validate(leaveIdParamsSchema, 'params'),
    validate(manageLeaveSchema),
    controller.manage,
  );

  return router;
}
