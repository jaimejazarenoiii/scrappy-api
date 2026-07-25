import type { RequestHandler } from 'express';
import { AppError } from '../../../shared/errors/app-error.js';
import { success } from '../../../shared/http/api-response.js';
import type { AuthorizationContext } from '../../../shared/policy/authorization-context.js';
import { logTrackingLocationRejected } from '../application/services/tracking-audit.service.js';
import type { UpsertCurrentLocationUseCase } from '../application/use-cases/upsert-current-location.use-case.js';
import type { GetEmployeeLocationUseCase } from '../application/use-cases/get-employee-location.use-case.js';
import type { GetEmployeeTrackingStatusUseCase } from '../application/use-cases/get-employee-tracking-status.use-case.js';
import type { GetTripTrackingLocationsUseCase } from '../application/use-cases/get-trip-tracking-locations.use-case.js';
import type { GetTripTrackingRouteUseCase } from '../application/use-cases/get-trip-tracking-route.use-case.js';
import type { ListActiveTripLocationsUseCase } from '../application/use-cases/list-active-trip-locations.use-case.js';
import type { AdminListCompanyTripLocationsUseCase } from '../application/use-cases/admin-list-company-trip-locations.use-case.js';
import type { GetTrackingSessionUseCase } from '../application/use-cases/get-tracking-session.use-case.js';
import type { ListAvailableTrackingTripsUseCase } from '../application/use-cases/list-available-tracking-trips.use-case.js';
import type {
  ListActiveLocationsQuery,
  TrackingSessionQuery,
  TripRouteQuery,
  UpsertLocationBody,
} from './tracking.schemas.js';

function authContext(req: {
  auth?: { companyId: string; userId: string; role: AuthorizationContext['role'] };
}): AuthorizationContext {
  return {
    companyId: req.auth!.companyId,
    userId: req.auth!.userId,
    role: req.auth!.role,
  };
}

export class TrackingController {
  constructor(
    private readonly upsertCurrentLocationUseCase: UpsertCurrentLocationUseCase,
    private readonly getEmployeeLocationUseCase: GetEmployeeLocationUseCase,
    private readonly getEmployeeTrackingStatusUseCase: GetEmployeeTrackingStatusUseCase,
    private readonly getTripTrackingLocationsUseCase: GetTripTrackingLocationsUseCase,
    private readonly getTripTrackingRouteUseCase: GetTripTrackingRouteUseCase,
    private readonly listActiveTripLocationsUseCase: ListActiveTripLocationsUseCase,
    private readonly adminListCompanyTripLocationsUseCase: AdminListCompanyTripLocationsUseCase,
    private readonly getTrackingSessionUseCase: GetTrackingSessionUseCase,
    private readonly listAvailableTrackingTripsUseCase: ListAvailableTrackingTripsUseCase,
  ) {}

  upsertLocation: RequestHandler = async (req, res, next) => {
    const auth = authContext(req);
    try {
      const data = await this.upsertCurrentLocationUseCase.execute(
        auth,
        req.body as UpsertLocationBody,
        { channel: 'rest' },
      );
      res.json(success(data));
    } catch (error) {
      if (error instanceof AppError) {
        logTrackingLocationRejected({
          companyId: auth.companyId,
          userId: auth.userId,
          channel: 'rest',
          code: error.code,
          message: error.message,
        });
      }
      next(error);
    }
  };

  getEmployeeLocation: RequestHandler = async (req, res, next) => {
    try {
      const data = await this.getEmployeeLocationUseCase.execute(
        authContext(req),
        String(req.params.employeeId),
      );
      res.json(success(data));
    } catch (error) {
      next(error);
    }
  };

  getEmployeeStatus: RequestHandler = async (req, res, next) => {
    try {
      const data = await this.getEmployeeTrackingStatusUseCase.execute(
        authContext(req),
        String(req.params.employeeId),
      );
      res.json(success(data));
    } catch (error) {
      next(error);
    }
  };

  getTripLocations: RequestHandler = async (req, res, next) => {
    try {
      const data = await this.getTripTrackingLocationsUseCase.execute(
        authContext(req),
        String(req.params.tripId),
      );
      res.json(success(data));
    } catch (error) {
      next(error);
    }
  };

  getTripRoute: RequestHandler = async (req, res, next) => {
    try {
      const query = req.validatedQuery as TripRouteQuery;
      const data = await this.getTripTrackingRouteUseCase.execute(
        authContext(req),
        String(req.params.tripId),
        query,
      );
      res.json(success(data));
    } catch (error) {
      next(error);
    }
  };

  listActiveTripLocations: RequestHandler = async (req, res, next) => {
    try {
      const query = req.query as unknown as ListActiveLocationsQuery;
      const result = await this.listActiveTripLocationsUseCase.execute(authContext(req), query);
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };

  adminListCompanyTripLocations: RequestHandler = async (req, res, next) => {
    try {
      const query = req.query as unknown as ListActiveLocationsQuery;
      const result = await this.adminListCompanyTripLocationsUseCase.execute(
        authContext(req),
        String(req.params.companyId),
        query,
      );
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };

  getTrackingSession: RequestHandler = async (req, res, next) => {
    try {
      const query = req.query as unknown as TrackingSessionQuery;
      const data = await this.getTrackingSessionUseCase.execute(authContext(req), query);
      res.json(success(data));
    } catch (error) {
      next(error);
    }
  };

  listAvailableTrips: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listAvailableTrackingTripsUseCase.execute(authContext(req));
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };
}
