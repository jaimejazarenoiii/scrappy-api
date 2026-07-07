import type { Express } from 'express';
import type { Container } from '../config/container.js';
import { createAuthenticationMiddleware } from '../middleware/authentication.middleware.js';
import { companyResolutionMiddleware } from '../middleware/company-resolution.middleware.js';
import { createAuthRoutes } from './auth/presentation/auth.routes.js';
import { createCompanyRoutes } from './company/presentation/company.routes.js';
import { createEmployeeRoutes } from './employee/presentation/employee.routes.js';
import { createUserRoutes } from './user/presentation/user.routes.js';

export function registerModuleRoutes(app: Express, container: Container): void {
  const authn = createAuthenticationMiddleware(container.tokenProvider);
  app.use('/api/v1', createCompanyRoutes(container.companyController, authn));
  app.use('/api/v1', createAuthRoutes(container.authController, authn));
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    createUserRoutes(container.userController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    createEmployeeRoutes(container.employeeController),
  );
}
