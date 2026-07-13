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
import { createReportsRoutes } from './reports/index.js';
import { createTripRoutes } from './trip/index.js';
import { createExpenseRoutes } from './expense/index.js';
import { createActivityLogRoutes } from './activity-log/index.js';

export function registerModuleRoutes(app: Express, container: Container): void {
  const authn = createAuthenticationMiddleware(container.tokenProvider);
  const gate = container.passwordChangeGate;

  app.use('/api/v1', createCompanyRoutes(container.companyController, authn));
  app.use('/api/v1', createAuthRoutes(container.authController, authn));
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    gate,
    createUserRoutes(container.userController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    gate,
    createEmployeeRoutes(container.employeeController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    gate,
    createBranchRoutes(container.branchController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    gate,
    createWarehouseRoutes(container.warehouseController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    gate,
    createVehicleRoutes(container.vehicleController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    gate,
    createCashAdvanceRoutes(container.cashAdvanceController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    gate,
    createPayrollRoutes(container.payrollController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    gate,
    createLeaveRoutes(container.leaveController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    gate,
    createAttendanceRoutes(container.attendanceController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    gate,
    createWorkforceDashboardRoutes(container.workforceDashboardController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    gate,
    createTransactionRoutes(container.transactionController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    gate,
    createAnalyticsRoutes(container.analyticsController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    gate,
    createReportsRoutes(container.reportsController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    gate,
    createTripRoutes(container.tripController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    gate,
    createExpenseRoutes(container.expenseController),
  );
  app.use(
    '/api/v1',
    authn,
    companyResolutionMiddleware,
    gate,
    createActivityLogRoutes(container.activityLogController),
  );
}
