import type { Request, RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { AuthorizationContext } from '../../../shared/policy/authorization-context.js';
import type { AdminGetAnalyticsOverviewUseCase } from '../application/use-cases/admin-get-analytics-overview.use-case.js';
import type { AdminGetCompanyScopedAnalyticsUseCase } from '../application/use-cases/admin-get-company-scoped-analytics.use-case.js';
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

export class AdminAnalyticsController {
  constructor(
    private readonly overviewUseCase: AdminGetAnalyticsOverviewUseCase,
    private readonly scopedUseCase: AdminGetCompanyScopedAnalyticsUseCase,
  ) {}

  overview: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(await this.overviewUseCase.execute(authContext(req), queryFromRequest(req))),
      );
    } catch (error) {
      next(error);
    }
  };

  company: RequestHandler = async (req, res, next) => {
    try {
      const { companyId } = req.params as { companyId: string };
      res.json(
        success(
          await this.scopedUseCase.company(authContext(req), companyId, queryFromRequest(req)),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  transactions: RequestHandler = async (req, res, next) => {
    try {
      const { companyId } = req.params as { companyId: string };
      res.json(
        success(
          await this.scopedUseCase.transactions(authContext(req), companyId, queryFromRequest(req)),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  trips: RequestHandler = async (req, res, next) => {
    try {
      const { companyId } = req.params as { companyId: string };
      res.json(
        success(await this.scopedUseCase.trips(authContext(req), companyId, queryFromRequest(req))),
      );
    } catch (error) {
      next(error);
    }
  };

  expenses: RequestHandler = async (req, res, next) => {
    try {
      const { companyId } = req.params as { companyId: string };
      res.json(
        success(
          await this.scopedUseCase.expenses(authContext(req), companyId, queryFromRequest(req)),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  workforce: RequestHandler = async (req, res, next) => {
    try {
      const { companyId } = req.params as { companyId: string };
      res.json(
        success(
          await this.scopedUseCase.workforce(authContext(req), companyId, queryFromRequest(req)),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  organization: RequestHandler = async (req, res, next) => {
    try {
      const { companyId } = req.params as { companyId: string };
      res.json(
        success(
          await this.scopedUseCase.organization(authContext(req), companyId, queryFromRequest(req)),
        ),
      );
    } catch (error) {
      next(error);
    }
  };
}
