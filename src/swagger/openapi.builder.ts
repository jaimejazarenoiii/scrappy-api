import { authOpenApiPaths } from '../modules/auth/presentation/auth.openapi.js';
import { companyOpenApiPaths } from '../modules/company/presentation/company.openapi.js';
import { adminCompanyOpenApiPaths } from '../modules/company/presentation/admin-company.openapi.js';
import { employeeOpenApiPaths } from '../modules/employee/presentation/employee.openapi.js';
import { branchOpenApiPaths } from '../modules/branch/presentation/branch.openapi.js';
import { warehouseOpenApiPaths } from '../modules/warehouse/presentation/warehouse.openapi.js';
import { vehicleOpenApiPaths } from '../modules/vehicle/presentation/vehicle.openapi.js';
import { leaveOpenApiPaths } from '../modules/leave/presentation/leave.openapi.js';
import { userOpenApiPaths } from '../modules/user/presentation/user.openapi.js';
import { cashAdvanceOpenApiPaths } from '../modules/cash-advance/presentation/cash-advance.openapi.js';
import { attendanceOpenApiPaths } from '../modules/attendance/presentation/attendance.openapi.js';
import { workforceDashboardOpenApiPaths } from '../modules/workforce-dashboard/presentation/workforce-dashboard.openapi.js';
import { transactionOpenApiPaths } from '../modules/transaction/presentation/transaction.openapi.js';
import { payrollOpenApiPaths } from '../modules/payroll/presentation/payroll.openapi.js';
import { tripOpenApiPaths } from '../modules/trip/presentation/trip.openapi.js';
import { expenseOpenApiPaths } from '../modules/expense/presentation/expense.openapi.js';
import { analyticsOpenApiPaths } from '../modules/analytics/presentation/analytics.openapi.js';
import { adminAnalyticsOpenApiPaths } from '../modules/analytics/presentation/admin-analytics.openapi.js';
import { reportsOpenApiPaths } from '../modules/reports/presentation/reports.openapi.js';
import { activityLogOpenApiPaths } from '../modules/activity-log/presentation/activity-log.openapi.js';
import { subscriptionOpenApiPaths } from '../modules/subscription/presentation/subscription.openapi.js';
import { commonSchemas } from './common-schemas.js';
import { commonResponses } from './common-responses.js';

export function buildOpenApiDocument(): object {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Scrappy API',
      version: '1.0.0',
      description: 'Scrappy API — Company, Identity, Organization, and Workforce Management',
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
      ...adminCompanyOpenApiPaths,
      ...authOpenApiPaths,
      ...userOpenApiPaths,
      ...employeeOpenApiPaths,
      ...branchOpenApiPaths,
      ...warehouseOpenApiPaths,
      ...vehicleOpenApiPaths,
      ...cashAdvanceOpenApiPaths,
      ...payrollOpenApiPaths,
      ...leaveOpenApiPaths,
      ...attendanceOpenApiPaths,
      ...workforceDashboardOpenApiPaths,
      ...transactionOpenApiPaths,
      ...tripOpenApiPaths,
      ...expenseOpenApiPaths,
      ...analyticsOpenApiPaths,
      ...adminAnalyticsOpenApiPaths,
      ...reportsOpenApiPaths,
      ...activityLogOpenApiPaths,
      ...subscriptionOpenApiPaths,
    },
  };
}
