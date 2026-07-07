import type { Express } from 'express';
import type { Container } from '../../infrastructure/providers/container.js';
import { createBootstrapRoutes } from './health.routes.js';

/**
 * Mounts all application route modules on the Express app.
 * @param app - Express application
 * @param container - DI container
 */
export function registerRoutes(app: Express, container: Container): void {
  app.use(createBootstrapRoutes(container));
}
