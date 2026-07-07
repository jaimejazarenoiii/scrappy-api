import type { RequestHandler } from 'express';
import { Router } from 'express';
import { validate } from '../../../middleware/validation.middleware.js';
import { loginSchema, refreshSchema, forgotPasswordSchema } from './auth.schemas.js';
import type { AuthController } from './auth.controller.js';

export function createAuthRoutes(
  controller: AuthController,
  authenticationMiddleware: RequestHandler,
): Router {
  const router = Router();
  router.post('/auth/login', validate(loginSchema), controller.login);
  router.post('/auth/logout', authenticationMiddleware, controller.logout);
  router.post('/auth/refresh', validate(refreshSchema), controller.refresh);
  router.post('/auth/forgot-password', validate(forgotPasswordSchema), controller.forgotPassword);
  return router;
}
