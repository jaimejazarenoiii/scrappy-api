import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { buildOpenApiDocument } from './openapi.builder.js';

export function registerSwagger(app: Express): void {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(buildOpenApiDocument()));
}
