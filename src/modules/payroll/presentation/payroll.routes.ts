import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { PayrollController } from './payroll.controller.js';
import {
  generatePayrollSchema,
  listPayrollQuerySchema,
  markPayrollPaidSchema,
  payrollIdParamsSchema,
} from './payroll.schemas.js';

export function createPayrollRoutes(controller: PayrollController): Router {
  const router = Router();

  router.post(
    '/workforce/payroll',
    authorize(['OWNER', 'MANAGER']),
    validate(generatePayrollSchema),
    controller.generate,
  );
  router.get(
    '/workforce/payroll',
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    validate(listPayrollQuerySchema, 'query'),
    controller.listHistory,
  );
  router.get(
    '/workforce/payroll/:payrollId',
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    validate(payrollIdParamsSchema, 'params'),
    controller.getById,
  );
  router.post(
    '/workforce/payroll/:payrollId/mark-paid',
    authorize(['OWNER', 'MANAGER']),
    validate(payrollIdParamsSchema, 'params'),
    validate(markPayrollPaidSchema),
    controller.markPaid,
  );

  return router;
}
