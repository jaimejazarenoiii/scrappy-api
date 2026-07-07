import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { BranchController } from './branch.controller.js';
import {
  branchIdParamsSchema,
  createBranchSchema,
  listBranchesQuerySchema,
  updateBranchSchema,
} from './branch.schemas.js';

export function createBranchRoutes(controller: BranchController): Router {
  const router = Router();

  router.get(
    '/branches',
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    validate(listBranchesQuerySchema, 'query'),
    controller.list,
  );
  router.post(
    '/branches',
    authorize(['OWNER', 'MANAGER']),
    validate(createBranchSchema),
    controller.create,
  );
  router.get(
    '/branches/:branchId',
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    validate(branchIdParamsSchema, 'params'),
    controller.getById,
  );
  router.patch(
    '/branches/:branchId',
    authorize(['OWNER', 'MANAGER']),
    validate(branchIdParamsSchema, 'params'),
    validate(updateBranchSchema),
    controller.update,
  );
  router.post(
    '/branches/:branchId/archive',
    authorize(['OWNER', 'MANAGER']),
    validate(branchIdParamsSchema, 'params'),
    controller.archive,
  );

  return router;
}
