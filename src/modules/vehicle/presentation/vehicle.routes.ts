import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { VehicleController } from './vehicle.controller.js';
import {
  createVehicleSchema,
  listVehiclesQuerySchema,
  updateVehicleSchema,
  vehicleIdParamsSchema,
} from './vehicle.schemas.js';

export function createVehicleRoutes(controller: VehicleController): Router {
  const router = Router();

  router.get(
    '/vehicles',
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    validate(listVehiclesQuerySchema, 'query'),
    controller.list,
  );
  router.post(
    '/vehicles',
    authorize(['OWNER', 'MANAGER']),
    validate(createVehicleSchema),
    controller.create,
  );
  router.get(
    '/vehicles/:vehicleId',
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    validate(vehicleIdParamsSchema, 'params'),
    controller.getById,
  );
  router.patch(
    '/vehicles/:vehicleId',
    authorize(['OWNER', 'MANAGER']),
    validate(vehicleIdParamsSchema, 'params'),
    validate(updateVehicleSchema),
    controller.update,
  );
  router.post(
    '/vehicles/:vehicleId/archive',
    authorize(['OWNER', 'MANAGER']),
    validate(vehicleIdParamsSchema, 'params'),
    controller.archive,
  );

  return router;
}
