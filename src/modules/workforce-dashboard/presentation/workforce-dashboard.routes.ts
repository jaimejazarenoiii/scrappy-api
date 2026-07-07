import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import type { WorkforceDashboardController } from './workforce-dashboard.controller.js';

export function createWorkforceDashboardRoutes(controller: WorkforceDashboardController): Router {
  const router = Router();

  router.get(
    '/workforce/dashboard',
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    controller.getDashboard,
  );

  return router;
}
