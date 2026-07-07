import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { CashAdvanceController } from './cash-advance.controller.js';
import { createCashAdvanceSchema, listCashAdvanceQuerySchema } from './cash-advance.schemas.js';

export function createCashAdvanceRoutes(controller: CashAdvanceController): Router {
  const router = Router();

  router.post(
    '/workforce/cash-advances',
    authorize(['OWNER', 'MANAGER']),
    validate(createCashAdvanceSchema),
    controller.create,
  );
  router.get(
    '/workforce/cash-advances',
    authorize(['EMPLOYEE']),
    validate(listCashAdvanceQuerySchema, 'query'),
    controller.listMine,
  );
  router.get(
    '/workforce/cash-advances/company',
    authorize(['OWNER', 'MANAGER']),
    validate(listCashAdvanceQuerySchema, 'query'),
    controller.listCompany,
  );

  return router;
}
