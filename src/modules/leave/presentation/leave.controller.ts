import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { ListLeaveQuery } from '../domain/leave-record.repository.js';
import type { RequestLeaveUseCase } from '../application/use-cases/request-leave.use-case.js';
import type { ListMyLeaveUseCase } from '../application/use-cases/list-my-leave.use-case.js';
import type { ListCompanyLeaveUseCase } from '../application/use-cases/list-company-leave.use-case.js';
import type { GetLeaveDashboardUseCase } from '../application/use-cases/get-leave-dashboard.use-case.js';
import type { ManageLeaveUseCase } from '../application/use-cases/manage-leave.use-case.js';

export class LeaveController {
  constructor(
    private readonly requestLeaveUseCase: RequestLeaveUseCase,
    private readonly listMyLeaveUseCase: ListMyLeaveUseCase,
    private readonly listCompanyLeaveUseCase: ListCompanyLeaveUseCase,
    private readonly getLeaveDashboardUseCase: GetLeaveDashboardUseCase,
    private readonly manageLeaveUseCase: ManageLeaveUseCase,
  ) {}

  request: RequestHandler = async (req, res, next) => {
    try {
      res
        .status(201)
        .json(
          success(
            await this.requestLeaveUseCase.execute(req.auth!.companyId, req.auth!.userId, req.body),
          ),
        );
    } catch (error) {
      next(error);
    }
  };

  listMine: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listMyLeaveUseCase.execute(
        req.auth!.companyId,
        req.auth!.userId,
        req.validatedQuery as ListLeaveQuery,
      );
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };

  listCompany: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listCompanyLeaveUseCase.execute(
        req.auth!.companyId,
        req.validatedQuery as ListLeaveQuery,
      );
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };

  dashboard: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getLeaveDashboardUseCase.execute(
            req.auth!.companyId,
            (req.validatedQuery as { date?: string } | undefined)?.date,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  manage: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.manageLeaveUseCase.execute(
            String(req.params.leaveId),
            req.auth!.companyId,
            req.body,
            req.auth!.userId,
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };
}
