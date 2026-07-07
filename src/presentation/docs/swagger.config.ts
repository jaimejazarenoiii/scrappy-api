import swaggerJsdoc from 'swagger-jsdoc';
import { API_NAME, API_VERSION } from '../../shared/constants/app.constants.js';

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: API_NAME,
    version: API_VERSION,
    description:
      'Junkshop management system API (Philippines) — bootstrap endpoints only. Business endpoints will be added in future specifications.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development',
    },
  ],
  components: {
    schemas: {
      ApiEnvelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { nullable: true },
          meta: { type: 'object' },
          error: { nullable: true },
        },
      },
      ServiceIdentity: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Scrappy API' },
          version: { type: 'string', example: '1.0.0' },
          status: { type: 'string', example: 'running' },
        },
      },
      HealthStatus: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['healthy', 'unhealthy'] },
          checks: {
            type: 'object',
            additionalProperties: { type: 'string', enum: ['up', 'down'] },
          },
        },
      },
    },
  },
};

/**
 * Swagger JSDoc options for bootstrap endpoint annotations.
 */
export const swaggerOptions: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: ['./src/presentation/docs/bootstrap.openapi.ts'],
};

/**
 * Generates the OpenAPI specification from JSDoc annotations.
 * @returns OpenAPI spec object
 */
export function generateSwaggerSpec(): object {
  return swaggerJsdoc(swaggerOptions);
}
