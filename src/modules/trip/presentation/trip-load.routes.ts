import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { TripLoadController } from './trip-load.controller.js';
import {
  createTripLoadItemSchema,
  createTripLoadSchema,
  enableTripLoadSchema,
  tripLoadIdParamsSchema,
  tripLoadItemIdParamsSchema,
  updateTripLoadItemSchema,
  updateTripLoadSchema,
  updateTripLoadSettingsSchema,
} from './trip-load.schemas.js';

const MANAGER_ROLES = ['OWNER', 'MANAGER'] as const;
/** Content mutations: assigned employees may edit load items on draft trips. */
const LOAD_CONTENT_ROLES = ['OWNER', 'MANAGER', 'EMPLOYEE'] as const;
const READ_ROLES = ['OWNER', 'MANAGER', 'EMPLOYEE'] as const;

export function createTripLoadRoutes(controller: TripLoadController): Router {
  const router = Router();

  router.get(
    '/companies/me/trip-load-settings',
    authorize([...MANAGER_ROLES]),
    controller.getSettings,
  );
  router.patch(
    '/companies/me/trip-load-settings',
    authorize([...MANAGER_ROLES]),
    validate(updateTripLoadSettingsSchema),
    controller.updateSettings,
  );

  router.post(
    '/trips/:tripId/load/enable',
    authorize([...MANAGER_ROLES]),
    validate(tripLoadIdParamsSchema, 'params'),
    validate(enableTripLoadSchema),
    controller.enable,
  );
  router.post(
    '/trips/:tripId/load/disable',
    authorize([...MANAGER_ROLES]),
    validate(tripLoadIdParamsSchema, 'params'),
    controller.disable,
  );

  router.get(
    '/trips/:tripId/load/summary',
    authorize([...READ_ROLES]),
    validate(tripLoadIdParamsSchema, 'params'),
    controller.getSummary,
  );

  router.post(
    '/trips/:tripId/load/items',
    authorize([...LOAD_CONTENT_ROLES]),
    validate(tripLoadIdParamsSchema, 'params'),
    validate(createTripLoadItemSchema),
    controller.addItem,
  );
  router.patch(
    '/trips/:tripId/load/items/:itemId',
    authorize([...LOAD_CONTENT_ROLES]),
    validate(tripLoadItemIdParamsSchema, 'params'),
    validate(updateTripLoadItemSchema),
    controller.updateItem,
  );
  router.delete(
    '/trips/:tripId/load/items/:itemId',
    authorize([...LOAD_CONTENT_ROLES]),
    validate(tripLoadItemIdParamsSchema, 'params'),
    controller.removeItem,
  );

  router.post(
    '/trips/:tripId/load',
    authorize([...LOAD_CONTENT_ROLES]),
    validate(tripLoadIdParamsSchema, 'params'),
    validate(createTripLoadSchema),
    controller.createLoad,
  );
  router.get(
    '/trips/:tripId/load',
    authorize([...READ_ROLES]),
    validate(tripLoadIdParamsSchema, 'params'),
    controller.getLoad,
  );
  router.patch(
    '/trips/:tripId/load',
    authorize([...LOAD_CONTENT_ROLES]),
    validate(tripLoadIdParamsSchema, 'params'),
    validate(updateTripLoadSchema),
    controller.updateLoad,
  );
  router.delete(
    '/trips/:tripId/load',
    authorize([...LOAD_CONTENT_ROLES]),
    validate(tripLoadIdParamsSchema, 'params'),
    controller.deleteLoad,
  );

  return router;
}
