import { Router } from 'express';
import type { UserController } from './user.controller.js';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import { changePasswordSchema } from './user.schemas.js';

export function createUserRoutes(controller: UserController): Router {
  const router = Router();
  router.get('/users/me', authorize(['OWNER', 'MANAGER', 'EMPLOYEE']), controller.me);
  router.get(
    '/users/me/password-status',
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    controller.passwordStatus,
  );
  router.post(
    '/users/me/password',
    authorize(['OWNER', 'MANAGER', 'EMPLOYEE']),
    validate(changePasswordSchema),
    controller.changePassword,
  );
  return router;
}
