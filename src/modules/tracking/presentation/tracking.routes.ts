import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { createTrackingLocationRateLimitMiddleware } from '../../../middleware/rate-limit.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { TrackingController } from './tracking.controller.js';
import {
  companyIdParamsSchema,
  employeeIdParamsSchema,
  listActiveLocationsQuerySchema,
  trackingSessionQuerySchema,
  tripIdParamsSchema,
  upsertLocationBodySchema,
} from './tracking.schemas.js';

const MANAGER_ROLES = ['OWNER', 'MANAGER'] as const;

export function createTrackingRoutes(controller: TrackingController): Router {
  const router = Router();

  router.put(
    '/tracking/location',
    authorize(['EMPLOYEE']),
    createTrackingLocationRateLimitMiddleware(),
    validate(upsertLocationBodySchema),
    controller.upsertLocation,
  );

  router.get(
    '/tracking/session',
    authorize(['EMPLOYEE']),
    validate(trackingSessionQuerySchema, 'query'),
    controller.getTrackingSession,
  );

  router.get('/tracking/available-trips', authorize(['EMPLOYEE']), controller.listAvailableTrips);

  router.get(
    '/tracking/employees/:employeeId/location',
    authorize(['OWNER', 'MANAGER']),
    validate(employeeIdParamsSchema, 'params'),
    controller.getEmployeeLocation,
  );

  router.get(
    '/tracking/employees/:employeeId/status',
    authorize(['OWNER', 'MANAGER']),
    validate(employeeIdParamsSchema, 'params'),
    controller.getEmployeeStatus,
  );

  router.get(
    '/trips/:tripId/tracking/locations',
    authorize([...MANAGER_ROLES]),
    validate(tripIdParamsSchema, 'params'),
    controller.getTripLocations,
  );

  router.get(
    '/tracking/trips/active/locations',
    authorize([...MANAGER_ROLES]),
    validate(listActiveLocationsQuerySchema, 'query'),
    controller.listActiveTripLocations,
  );

  router.get(
    '/admin/companies/:companyId/tracking/trips/active/locations',
    authorize(['SUPER_ADMIN']),
    validate(companyIdParamsSchema, 'params'),
    validate(listActiveLocationsQuerySchema, 'query'),
    controller.adminListCompanyTripLocations,
  );

  return router;
}
