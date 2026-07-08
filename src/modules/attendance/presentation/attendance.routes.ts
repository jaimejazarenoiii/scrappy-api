import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { AttendanceController } from './attendance.controller.js';
import {
  attendanceDashboardQuerySchema,
  attendanceIdParamsSchema,
  listAttendanceQuerySchema,
  manageAttendanceSchema,
  timeInSchema,
  timeOutSchema,
} from './attendance.schemas.js';

export function createAttendanceRoutes(controller: AttendanceController): Router {
  const router = Router();

  router.post(
    '/workforce/attendance/time-in',
    authorize(['MANAGER', 'EMPLOYEE']),
    validate(timeInSchema),
    controller.timeIn,
  );
  router.post(
    '/workforce/attendance/time-out',
    authorize(['MANAGER', 'EMPLOYEE']),
    validate(timeOutSchema),
    controller.timeOut,
  );
  router.get(
    '/workforce/attendance/status',
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    controller.status,
  );
  router.get(
    '/workforce/attendance',
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    validate(listAttendanceQuerySchema, 'query'),
    controller.listMine,
  );
  router.get(
    '/workforce/attendance/company',
    authorize(['OWNER', 'MANAGER']),
    validate(listAttendanceQuerySchema, 'query'),
    controller.listCompany,
  );
  router.get(
    '/workforce/attendance/dashboard',
    authorize(['OWNER', 'MANAGER']),
    validate(attendanceDashboardQuerySchema, 'query'),
    controller.dashboard,
  );
  router.patch(
    '/workforce/attendance/:attendanceId',
    authorize(['OWNER', 'MANAGER']),
    validate(attendanceIdParamsSchema, 'params'),
    validate(manageAttendanceSchema),
    controller.manage,
  );

  return router;
}
