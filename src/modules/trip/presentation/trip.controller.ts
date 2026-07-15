import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { AuthorizationContext } from '../../../shared/policy/authorization-context.js';
import type { ListMyTripsUseCase } from '../application/use-cases/list-my-trips.use-case.js';
import type { ListTripsUseCase } from '../application/use-cases/list-trips.use-case.js';
import type { GetTripDashboardUseCase } from '../application/use-cases/get-trip-dashboard.use-case.js';
import type { CreateTripUseCase } from '../application/use-cases/create-trip.use-case.js';
import type { GetTripUseCase } from '../application/use-cases/get-trip.use-case.js';
import type { GetTripHistoryUseCase } from '../application/use-cases/get-trip-history.use-case.js';
import type { ListTripTransactionsUseCase } from '../application/use-cases/list-trip-transactions.use-case.js';
import type { StartTripUseCase } from '../application/use-cases/start-trip.use-case.js';
import type { AddTripMembersUseCase } from '../application/use-cases/add-trip-members.use-case.js';
import type { UpdateTripMemberUseCase } from '../application/use-cases/update-trip-member.use-case.js';
import type { RemoveTripMemberUseCase } from '../application/use-cases/remove-trip-member.use-case.js';
import type { CreateTripRequestDto } from '../application/dto/create-trip.request.js';
import type { StartTripRequestDto } from '../application/dto/start-trip.request.js';
import type { CompleteTripUseCase } from '../application/use-cases/complete-trip.use-case.js';
import type { CompleteTripRequestDto } from '../application/dto/complete-trip.request.js';
import type {
  AddTripMembersRequestDto,
  TripMemberParams,
  UpdateTripMemberRequestDto,
} from '../application/dto/trip-member.request.js';
import type {
  ListTripsQuery,
  ListMyTripsQuery,
  ListTripTransactionsQuery,
} from './trip.schemas.js';

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
    private readonly listMyTripsUseCase: ListMyTripsUseCase,
    private readonly getTripDashboardUseCase: GetTripDashboardUseCase,
    private readonly createTripUseCase: CreateTripUseCase,
    private readonly getTripUseCase: GetTripUseCase,
    private readonly getTripHistoryUseCase: GetTripHistoryUseCase,
    private readonly listTripTransactionsUseCase: ListTripTransactionsUseCase,
    private readonly startTripUseCase: StartTripUseCase,
    private readonly addTripMembersUseCase: AddTripMembersUseCase,
    private readonly updateTripMemberUseCase: UpdateTripMemberUseCase,
    private readonly removeTripMemberUseCase: RemoveTripMemberUseCase,
    private readonly completeTripUseCase: CompleteTripUseCase,
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

  listMine: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listMyTripsUseCase.execute(
        authContext(req),
        req.validatedQuery as ListMyTripsQuery,
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

  start: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.startTripUseCase.execute(
            req.params.tripId as string,
            authContext(req),
            req.body as StartTripRequestDto,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  complete: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.completeTripUseCase.execute(
            req.params.tripId as string,
            authContext(req),
            req.body as CompleteTripRequestDto,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  addMembers: RequestHandler = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          success(
            await this.addTripMembersUseCase.execute(
              req.params.tripId as string,
              authContext(req),
              req.body as AddTripMembersRequestDto,
            ),
          ),
        );
    } catch (error) {
      next(error);
    }
  };

  updateMember: RequestHandler = async (req, res, next) => {
    try {
      const params = req.params as TripMemberParams;
      res.json(
        success(
          await this.updateTripMemberUseCase.execute(
            params.tripId,
            params.memberId,
            authContext(req),
            req.body as UpdateTripMemberRequestDto,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  removeMember: RequestHandler = async (req, res, next) => {
    try {
      const params = req.params as TripMemberParams;
      await this.removeTripMemberUseCase.execute(params.tripId, params.memberId, authContext(req));
      res.json(success({ deleted: true }));
    } catch (error) {
      next(error);
    }
  };
}
