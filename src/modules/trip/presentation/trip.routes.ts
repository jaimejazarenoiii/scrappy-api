import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { TripController } from './trip.controller.js';
import {
  listTripsQuerySchema,
  listMyTripsQuerySchema,
  createTripSchema,
  tripIdParamsSchema,
  listTripTransactionsQuerySchema,
} from './trip.schemas.js';
import { startTripSchema } from '../application/dto/start-trip.request.js';
import { completeTripSchema } from '../application/dto/complete-trip.request.js';
import {
  addTripMembersSchema,
  updateTripMemberSchema,
  tripMemberParamsSchema,
} from '../application/dto/trip-member.request.js';

const MANAGER_ROLES = ['OWNER', 'MANAGER'] as const;
const ALL_TENANT_ROLES = ['OWNER', 'MANAGER', 'EMPLOYEE'] as const;

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
    '/trips/mine',
    authorize([...ALL_TENANT_ROLES]),
    validate(listMyTripsQuerySchema, 'query'),
    controller.listMine,
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

  router.post(
    '/trips/:tripId/complete',
    authorize([...MANAGER_ROLES]),
    validate(tripIdParamsSchema, 'params'),
    validate(completeTripSchema),
    controller.complete,
  );

  router.post(
    '/trips/:tripId/members',
    authorize([...MANAGER_ROLES]),
    validate(tripIdParamsSchema, 'params'),
    validate(addTripMembersSchema),
    controller.addMembers,
  );

  router.patch(
    '/trips/:tripId/members/:memberId',
    authorize([...MANAGER_ROLES]),
    validate(tripMemberParamsSchema, 'params'),
    validate(updateTripMemberSchema),
    controller.updateMember,
  );

  router.delete(
    '/trips/:tripId/members/:memberId',
    authorize([...MANAGER_ROLES]),
    validate(tripMemberParamsSchema, 'params'),
    controller.removeMember,
  );

  return router;
}
