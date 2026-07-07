import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import type { Container } from './infrastructure/providers/container.js';
import { errorMiddleware } from './presentation/middlewares/error.middleware.js';
import { notFoundMiddleware } from './presentation/middlewares/not-found.middleware.js';
import { createRequestLoggerMiddleware } from './presentation/middlewares/request-logger.middleware.js';
import { registerRoutes } from './presentation/routes/index.js';
import { generateSwaggerSpec } from './presentation/docs/swagger.config.js';

/**
 * Creates and configures the Express application.
 * @param container - Wired DI container
 * @returns Configured Express app (not listening)
 */
export function createApp(container: Container): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json());
  app.use(createRequestLoggerMiddleware());

  const swaggerSpec = generateSwaggerSpec();
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  registerRoutes(app, container);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
