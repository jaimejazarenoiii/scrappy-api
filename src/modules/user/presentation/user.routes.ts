import { Router } from 'express';
import type { UserController } from './user.controller.js';
import { authorize } from '../../../middleware/authorization.middleware.js';

export function createUserRoutes(controller: UserController): Router {
  const router = Router();
  router.get('/users/me', authorize(['OWNER', 'MANAGER', 'EMPLOYEE']), controller.me);
  return router;
}
