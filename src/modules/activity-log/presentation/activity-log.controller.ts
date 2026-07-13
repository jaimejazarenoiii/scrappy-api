import type { RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { AuthorizationContext } from '../../../shared/policy/authorization-context.js';
import type { ListActivityLogsUseCase } from '../application/use-cases/list-activity-logs.use-case.js';
import type { GetActivityLogUseCase } from '../application/use-cases/get-activity-log.use-case.js';
import type { ActivityLogListQuery } from './activity-log.schemas.js';

function authContext(req: {
  auth?: { companyId: string; userId: string; role: AuthorizationContext['role'] };
}): AuthorizationContext {
  return {
    companyId: req.auth!.companyId,
    userId: req.auth!.userId,
    role: req.auth!.role,
  };
}

export class ActivityLogController {
  constructor(
    private readonly listActivityLogsUseCase: ListActivityLogsUseCase,
    private readonly getActivityLogUseCase: GetActivityLogUseCase,
  ) {}

  list: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listActivityLogsUseCase.execute(
        authContext(req),
        req.validatedQuery as ActivityLogListQuery,
      );
      res.json(success(result.items, { ...result.meta }));
    } catch (error) {
      next(error);
    }
  };

  getById: RequestHandler = async (req, res, next) => {
    try {
      res.json(
        success(
          await this.getActivityLogUseCase.execute(
            String(req.params.activityLogId),
            authContext(req),
          ),
        ),
      );
    } catch (error) {
      next(error);
    }
  };
}
