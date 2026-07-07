import { authOpenApiPaths } from '../modules/auth/presentation/auth.openapi.js';
import { companyOpenApiPaths } from '../modules/company/presentation/company.openapi.js';
import { employeeOpenApiPaths } from '../modules/employee/presentation/employee.openapi.js';
import { branchOpenApiPaths } from '../modules/branch/presentation/branch.openapi.js';
import { warehouseOpenApiPaths } from '../modules/warehouse/presentation/warehouse.openapi.js';
import { vehicleOpenApiPaths } from '../modules/vehicle/presentation/vehicle.openapi.js';
import { userOpenApiPaths } from '../modules/user/presentation/user.openapi.js';
import { commonSchemas } from './common-schemas.js';
import { commonResponses } from './common-responses.js';

export function buildOpenApiDocument(): object {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Scrappy API',
      version: '1.0.0',
      description: 'Scrappy API — Company, Identity, and Organization Management',
    },
    servers: [{ url: '/', description: 'API root' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: commonSchemas,
      responses: commonResponses,
    },
    paths: {
      ...companyOpenApiPaths,
      ...authOpenApiPaths,
      ...userOpenApiPaths,
      ...employeeOpenApiPaths,
      ...branchOpenApiPaths,
      ...warehouseOpenApiPaths,
      ...vehicleOpenApiPaths,
    },
  };
}
