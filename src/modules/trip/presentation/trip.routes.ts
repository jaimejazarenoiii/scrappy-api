import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { TripController } from './trip.controller.js';
import {
  listTripsQuerySchema,
  createTripSchema,
  tripIdParamsSchema,
  listTripTransactionsQuerySchema,
} from './trip.schemas.js';
import { startTripSchema } from '../application/dto/start-trip.request.js';

const MANAGER_ROLES = ['OWNER', 'MANAGER'] as const;

export function createTripRoutes(controller: TripController): Router {
  const router = Router();

  router.get('/trips/dashboard', authorize([...MANAGER_ROLES]), controller.dashboard);

  router.post(
    '/trips',
    authorize([...MANAGER_ROLES]),
    validate(createTripSchema),
    controller.create,
  );

  router.get(
    '/trips',
    authorize([...MANAGER_ROLES]),
    validate(listTripsQuerySchema, 'query'),
    controller.list,
  );

  router.get(
    '/trips/:tripId/history',
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    validate(tripIdParamsSchema, 'params'),
    controller.history,
  );

  router.get(
    '/trips/:tripId/transactions',
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    validate(tripIdParamsSchema, 'params'),
    validate(listTripTransactionsQuerySchema, 'query'),
    controller.listTransactions,
  );

  router.get(
    '/trips/:tripId',
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    validate(tripIdParamsSchema, 'params'),
    controller.getById,
  );

  router.post(
    '/trips/:tripId/start',
    authorize([...MANAGER_ROLES]),
    validate(tripIdParamsSchema, 'params'),
    validate(startTripSchema),
    controller.start,
  );

  return router;
}
