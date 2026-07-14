import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { AuthorizationContext } from '../../../shared/policy/authorization-context.js';
import type { CreateTripLoadUseCase } from '../application/use-cases/create-trip-load.use-case.js';
import type { GetTripLoadUseCase } from '../application/use-cases/get-trip-load.use-case.js';
import type { UpdateTripLoadUseCase } from '../application/use-cases/update-trip-load.use-case.js';
import type { DeleteTripLoadUseCase } from '../application/use-cases/delete-trip-load.use-case.js';
import type { AddTripLoadItemUseCase } from '../application/use-cases/add-trip-load-item.use-case.js';
import type { UpdateTripLoadItemUseCase } from '../application/use-cases/update-trip-load-item.use-case.js';
import type { RemoveTripLoadItemUseCase } from '../application/use-cases/remove-trip-load-item.use-case.js';
import type { EnableTripLoadUseCase } from '../application/use-cases/enable-trip-load.use-case.js';
import type { DisableTripLoadUseCase } from '../application/use-cases/disable-trip-load.use-case.js';
import type { GetTripLoadSummaryUseCase } from '../application/use-cases/get-trip-load-summary.use-case.js';
import type { GetCompanyTripLoadSettingsUseCase } from '../application/use-cases/get-company-trip-load-settings.use-case.js';
import type { UpdateCompanyTripLoadSettingsUseCase } from '../application/use-cases/update-company-trip-load-settings.use-case.js';

function authContext(req: {
  auth?: { companyId: string; userId: string; role: AuthorizationContext['role'] };
}): AuthorizationContext {
  return {
    companyId: req.auth!.companyId,
    userId: req.auth!.userId,
    role: req.auth!.role,
  };
}

export class TripLoadController {
  constructor(
    private readonly createTripLoadUseCase: CreateTripLoadUseCase,
    private readonly getTripLoadUseCase: GetTripLoadUseCase,
    private readonly updateTripLoadUseCase: UpdateTripLoadUseCase,
    private readonly deleteTripLoadUseCase: DeleteTripLoadUseCase,
    private readonly addTripLoadItemUseCase: AddTripLoadItemUseCase,
    private readonly updateTripLoadItemUseCase: UpdateTripLoadItemUseCase,
    private readonly removeTripLoadItemUseCase: RemoveTripLoadItemUseCase,
    private readonly enableTripLoadUseCase: EnableTripLoadUseCase,
    private readonly disableTripLoadUseCase: DisableTripLoadUseCase,
    private readonly getTripLoadSummaryUseCase: GetTripLoadSummaryUseCase,
    private readonly getCompanyTripLoadSettingsUseCase: GetCompanyTripLoadSettingsUseCase,
    private readonly updateCompanyTripLoadSettingsUseCase: UpdateCompanyTripLoadSettingsUseCase,
  ) {}

  createLoad: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.createTripLoadUseCase.execute(
        req.params.tripId as string,
        authContext(req),
        req.body,
      );
      res.status(201).json(success(result));
    } catch (error) {
      next(error);
    }
  };

  getLoad: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getTripLoadUseCase.execute(req.params.tripId as string, authContext(req)),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  updateLoad: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.updateTripLoadUseCase.execute(
            req.params.tripId as string,
            authContext(req),
            req.body,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  deleteLoad: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.deleteTripLoadUseCase.execute(req.params.tripId as string, authContext(req)),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  getSummary: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getTripLoadSummaryUseCase.execute(
            req.params.tripId as string,
            authContext(req),
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  addItem: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.addTripLoadItemUseCase.execute(
        req.params.tripId as string,
        authContext(req),
        req.body,
      );
      res.status(201).json(success(result));
    } catch (error) {
      next(error);
    }
  };

  updateItem: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.updateTripLoadItemUseCase.execute(
            req.params.tripId as string,
            req.params.itemId as string,
            authContext(req),
            req.body,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  removeItem: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.removeTripLoadItemUseCase.execute(
            req.params.tripId as string,
            req.params.itemId as string,
            authContext(req),
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  enable: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.enableTripLoadUseCase.execute(
            req.params.tripId as string,
            authContext(req),
            req.body ?? {},
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  disable: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.disableTripLoadUseCase.execute(req.params.tripId as string, authContext(req)),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  getSettings: RequestHandler = async (req, res, next) => {
    try {
      res.json(success(await this.getCompanyTripLoadSettingsUseCase.execute(authContext(req))));
    } catch (error) {
      next(error);
    }
  };

  updateSettings: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.updateCompanyTripLoadSettingsUseCase.execute(authContext(req), req.body),
        ),
      );
    } catch (error) {
      next(error);
    }
  };
}
