import type { Request, RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { AuthorizationContext } from '../../../shared/policy/authorization-context.js';
import type { GetCompanyAnalyticsUseCase } from '../application/use-cases/get-company-analytics.use-case.js';
import type { GetTransactionAnalyticsUseCase } from '../application/use-cases/get-transaction-analytics.use-case.js';
import type { GetTripAnalyticsUseCase } from '../application/use-cases/get-trip-analytics.use-case.js';
import type { GetExpenseAnalyticsUseCase } from '../application/use-cases/get-expense-analytics.use-case.js';
import type { GetWorkforceAnalyticsUseCase } from '../application/use-cases/get-workforce-analytics.use-case.js';
import type { GetOrganizationAnalyticsUseCase } from '../application/use-cases/get-organization-analytics.use-case.js';
import type { ResolvedAnalyticsQuery } from '../application/services/analytics-filter-pipeline.js';
import type { AnalyticsFilterQuery } from './analytics.schemas.js';

function authContext(req: Request): AuthorizationContext {
  return {
    companyId: req.auth!.companyId,
    userId: req.auth!.userId,
    role: req.auth!.role,
  };
}

function queryFromRequest(req: Request): ResolvedAnalyticsQuery {
  return req.validatedQuery as AnalyticsFilterQuery;
}

export class AnalyticsController {
  constructor(
    private readonly getCompanyAnalyticsUseCase: GetCompanyAnalyticsUseCase,
    private readonly getTransactionAnalyticsUseCase: GetTransactionAnalyticsUseCase,
    private readonly getTripAnalyticsUseCase: GetTripAnalyticsUseCase,
    private readonly getExpenseAnalyticsUseCase: GetExpenseAnalyticsUseCase,
    private readonly getWorkforceAnalyticsUseCase: GetWorkforceAnalyticsUseCase,
    private readonly getOrganizationAnalyticsUseCase: GetOrganizationAnalyticsUseCase,
  ) {}

  getCompany: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getCompanyAnalyticsUseCase.execute(authContext(req), queryFromRequest(req)),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  getTransactions: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getTransactionAnalyticsUseCase.execute(
            authContext(req),
            queryFromRequest(req),
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  getTrips: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getTripAnalyticsUseCase.execute(authContext(req), queryFromRequest(req)),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  getExpenses: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getExpenseAnalyticsUseCase.execute(authContext(req), queryFromRequest(req)),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  getWorkforce: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getWorkforceAnalyticsUseCase.execute(authContext(req), queryFromRequest(req)),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  getOrganization: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getOrganizationAnalyticsUseCase.execute(
            authContext(req),
            queryFromRequest(req),
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };
}
