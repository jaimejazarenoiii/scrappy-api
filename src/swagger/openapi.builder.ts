import { authOpenApiPaths } from '../modules/auth/presentation/auth.openapi.js';
import { companyOpenApiPaths } from '../modules/company/presentation/company.openapi.js';
import { employeeOpenApiPaths } from '../modules/employee/presentation/employee.openapi.js';
import { userOpenApiPaths } from '../modules/user/presentation/user.openapi.js';
import { commonSchemas } from './common-schemas.js';

export function buildOpenApiDocument(): object {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Scrappy API',
      version: '1.0.0',
      description: 'Company & Identity Foundation API',
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: commonSchemas,
    },
    paths: {
      ...companyOpenApiPaths,
      ...authOpenApiPaths,
      ...userOpenApiPaths,
      ...employeeOpenApiPaths,
    },
  };
}
