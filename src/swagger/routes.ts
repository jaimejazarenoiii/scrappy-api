import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { loadConfig } from '../config/index.js';
import { buildOpenApiDocument } from './openapi.builder.js';

/** Swagger UI is available only outside production. */
export function registerSwagger(app: Express): void {
  if (loadConfig().NODE_ENV === 'production') {
    return;
  }
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(buildOpenApiDocument()));
}
