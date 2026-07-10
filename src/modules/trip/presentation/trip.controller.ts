import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { AuthorizationContext } from '../../../shared/policy/authorization-context.js';
import type { ListTripsUseCase } from '../application/use-cases/list-trips.use-case.js';
import type { GetTripDashboardUseCase } from '../application/use-cases/get-trip-dashboard.use-case.js';
import type { CreateTripUseCase } from '../application/use-cases/create-trip.use-case.js';
import type { GetTripUseCase } from '../application/use-cases/get-trip.use-case.js';
import type { GetTripHistoryUseCase } from '../application/use-cases/get-trip-history.use-case.js';
import type { ListTripTransactionsUseCase } from '../application/use-cases/list-trip-transactions.use-case.js';
import type { CreateTripRequestDto } from '../application/dto/create-trip.request.js';
import type { ListTripsQuery, ListTripTransactionsQuery } from './trip.schemas.js';

function authContext(req: {
  auth?: { companyId: string; userId: string; role: AuthorizationContext['role'] };
}): AuthorizationContext {
  return {
    companyId: req.auth!.companyId,
    userId: req.auth!.userId,
    role: req.auth!.role,
  };
}

export class TripController {
  constructor(
    private readonly listTripsUseCase: ListTripsUseCase,
    private readonly getTripDashboardUseCase: GetTripDashboardUseCase,
    private readonly createTripUseCase: CreateTripUseCase,
    private readonly getTripUseCase: GetTripUseCase,
    private readonly getTripHistoryUseCase: GetTripHistoryUseCase,
    private readonly listTripTransactionsUseCase: ListTripTransactionsUseCase,
  ) {}

  create: RequestHandler = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          success(
            await this.createTripUseCase.execute(
              authContext(req),
              req.body as CreateTripRequestDto,
            ),
          ),
        );
    } catch (error) {
      next(error);
    }
  };

  list: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listTripsUseCase.execute(
        authContext(req),
        req.validatedQuery as ListTripsQuery,
      );
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };

  dashboard: RequestHandler = async (req, res, next) => {
    try {
      res.json(success(await this.getTripDashboardUseCase.execute(authContext(req))));
    } catch (error) {
      next(error);
    }
  };

  getById: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(await this.getTripUseCase.execute(req.params.tripId as string, authContext(req))),
      );
    } catch (error) {
      next(error);
    }
  };

  listTransactions: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listTripTransactionsUseCase.execute(
        req.params.tripId as string,
        authContext(req),
        req.validatedQuery as ListTripTransactionsQuery,
      );
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };

  history: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getTripHistoryUseCase.execute(req.params.tripId as string, authContext(req)),
        ),
      );
    } catch (error) {
      next(error);
    }
  };
}
