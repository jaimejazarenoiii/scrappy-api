import { Router } from 'express';
import type { Container } from '../../infrastructure/providers/container.js';

/**
 * Registers bootstrap routes: GET / and GET /health.
 * @param container - DI container with wired controllers
 * @returns Express router
 */
export function createBootstrapRoutes(container: Container): Router {
  const router = Router();

  router.get('/', container.rootController.handle);
  router.get('/health', container.healthController.handle);

  return router;
}
