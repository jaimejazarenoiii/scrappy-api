import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { ActivityLogController } from './activity-log.controller.js';
import { activityLogIdParamsSchema, activityLogListQuerySchema } from './activity-log.schemas.js';

const MANAGER_ROLES = ['OWNER', 'MANAGER'] as const;

export function createActivityLogRoutes(controller: ActivityLogController): Router {
  const router = Router();

  router.get(
    '/activity-logs',
    authorize([...MANAGER_ROLES]),
    validate(activityLogListQuerySchema, 'query'),
    controller.list,
  );

  router.get(
    '/activity-logs/:activityLogId',
    authorize([...MANAGER_ROLES]),
    validate(activityLogIdParamsSchema, 'params'),
    controller.getById,
  );

  return router;
}
