import express, { type Express } from 'express';
import type { Container } from './config/container.js';
import { loadConfig } from './config/index.js';
import {
  API_NAME,
  API_STATUS_RUNNING,
  API_VERSION,
  CHECK_STATUS_DOWN,
  CHECK_STATUS_UP,
  HEALTH_STATUS_HEALTHY,
  HEALTH_STATUS_UNHEALTHY,
} from './shared/constants/app.constants.js';
import { success } from './shared/http/api-response.js';
import { requestIdMiddleware } from './middleware/request-id.middleware.js';
import { createRequestLoggerMiddleware } from './middleware/request-logger.middleware.js';
import { createCorsMiddleware } from './middleware/cors.middleware.js';
import { createSecurityHeadersMiddleware } from './middleware/security-headers.middleware.js';
import { createRateLimitMiddleware } from './middleware/rate-limit.middleware.js';
import { notFoundMiddleware } from './middleware/not-found.middleware.js';
import { errorHandlerMiddleware } from './middleware/error-handler.middleware.js';
import { registerSwagger } from './swagger/routes.js';
import { registerModuleRoutes } from './modules/index.js';

export function createApp(container: Container): Express {
  const app = express();
  const isProduction = loadConfig().NODE_ENV === 'production';
  app.disable('x-powered-by');
  app.use(requestIdMiddleware);
  app.use(createRequestLoggerMiddleware());
  app.use(createCorsMiddleware());
  app.use(createSecurityHeadersMiddleware());
  app.use(createRateLimitMiddleware());
  app.use(express.json());
  // Do not expose API identity at `/` in production (Railway public URL).
  if (!isProduction) {
    app.get('/', (_req, res) => {
      res.json(success({ name: API_NAME, version: API_VERSION, status: API_STATUS_RUNNING }));
    });
  }
  app.get('/health', async (_req, res) => {
    const healthy = await (container.healthIndicator?.check?.() ?? Promise.resolve(true));
    res.status(healthy ? 200 : 503).json(
      success({
        status: healthy ? HEALTH_STATUS_HEALTHY : HEALTH_STATUS_UNHEALTHY,
        checks: { database: healthy ? CHECK_STATUS_UP : CHECK_STATUS_DOWN },
      }),
    );
  });
  registerSwagger(app);
  registerModuleRoutes(app, container);
  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);
  return app;
}
