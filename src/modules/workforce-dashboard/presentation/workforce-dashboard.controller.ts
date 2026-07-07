import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { GetWorkforceDashboardUseCase } from '../application/use-cases/get-workforce-dashboard.use-case.js';

export class WorkforceDashboardController {
  constructor(private readonly getWorkforceDashboardUseCase: GetWorkforceDashboardUseCase) {}

  getDashboard: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getWorkforceDashboardUseCase.execute(req.auth!.companyId, req.auth!.userId),
        ),
      );
    } catch (error) {
      next(error);
    }
  };
}
