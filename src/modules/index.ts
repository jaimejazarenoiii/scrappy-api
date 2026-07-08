import type { Express } from 'express';
import type { Container } from '../config/container.js';
import { createAuthenticationMiddleware } from '../middleware/authentication.middleware.js';
import { companyResolutionMiddleware } from '../middleware/company-resolution.middleware.js';
import { createAuthRoutes } from './auth/presentation/auth.routes.js';
import { createCompanyRoutes } from './company/presentation/company.routes.js';
import { createEmployeeRoutes } from './employee/presentation/employee.routes.js';
import { createBranchRoutes } from './branch/presentation/branch.routes.js';
import { createWarehouseRoutes } from './warehouse/presentation/warehouse.routes.js';
import { createVehicleRoutes } from './vehicle/presentation/vehicle.routes.js';
import { createLeaveRoutes } from './leave/presentation/leave.routes.js';
import { createUserRoutes } from './user/presentation/user.routes.js';
import { createCashAdvanceRoutes } from './cash-advance/presentation/cash-advance.routes.js';
import { createPayrollRoutes } from './payroll/presentation/payroll.routes.js';
import { createAttendanceRoutes } from './attendance/presentation/attendance.routes.js';
import { createWorkforceDashboardRoutes } from './workforce-dashboard/presentation/workforce-dashboard.routes.js';
import { createTransactionRoutes } from './transaction/index.js';
import { createAnalyticsRoutes } from './analytics/index.js';

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
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    createBranchRoutes(container.branchController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    createWarehouseRoutes(container.warehouseController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    createVehicleRoutes(container.vehicleController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    createCashAdvanceRoutes(container.cashAdvanceController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    createPayrollRoutes(container.payrollController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    createLeaveRoutes(container.leaveController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    createAttendanceRoutes(container.attendanceController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    createWorkforceDashboardRoutes(container.workforceDashboardController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    createTransactionRoutes(container.transactionController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    createAnalyticsRoutes(container.analyticsController),
  );
}
