import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { WarehouseController } from './warehouse.controller.js';
import {
  warehouseIdParamsSchema,
  createWarehouseSchema,
  listWarehousesQuerySchema,
  updateWarehouseSchema,
} from './warehouse.schemas.js';

export function createWarehouseRoutes(controller: WarehouseController): Router {
  const router = Router();

  router.get(
    '/warehouses',
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    validate(listWarehousesQuerySchema, 'query'),
    controller.list,
  );
  router.post(
    '/warehouses',
    authorize(['OWNER', 'MANAGER']),
    validate(createWarehouseSchema),
    controller.create,
  );
  router.get(
    '/warehouses/:warehouseId',
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    validate(warehouseIdParamsSchema, 'params'),
    controller.getById,
  );
  router.patch(
    '/warehouses/:warehouseId',
    authorize(['OWNER', 'MANAGER']),
    validate(warehouseIdParamsSchema, 'params'),
    validate(updateWarehouseSchema),
    controller.update,
  );
  router.post(
    '/warehouses/:warehouseId/archive',
    authorize(['OWNER', 'MANAGER']),
    validate(warehouseIdParamsSchema, 'params'),
    controller.archive,
  );

  return router;
}
