import type { BranchRepository } from '../branch/domain/branch.repository.js';
import type { WarehouseRepository } from '../warehouse/domain/warehouse.repository.js';
import type { VehicleRepository } from '../vehicle/domain/vehicle.repository.js';
import type { EmployeeRepository } from '../employee/domain/employee.repository.js';
import type { AnalyticsQueryRepository } from './domain/analytics-query.repository.js';
import { AnalyticsPeriodResolverService } from './application/services/analytics-period-resolver.service.js';
import { AnalyticsFilterValidatorService } from './application/services/analytics-filter-validator.service.js';
import { AnalyticsFilterPipeline } from './application/services/analytics-filter-pipeline.js';
import { GetCompanyAnalyticsUseCase } from './application/use-cases/get-company-analytics.use-case.js';
import { GetTransactionAnalyticsUseCase } from './application/use-cases/get-transaction-analytics.use-case.js';
import { GetTripAnalyticsUseCase } from './application/use-cases/get-trip-analytics.use-case.js';
import { GetExpenseAnalyticsUseCase } from './application/use-cases/get-expense-analytics.use-case.js';
import { GetWorkforceAnalyticsUseCase } from './application/use-cases/get-workforce-analytics.use-case.js';
import { GetOrganizationAnalyticsUseCase } from './application/use-cases/get-organization-analytics.use-case.js';
import { AnalyticsController } from './presentation/analytics.controller.js';

export { createAnalyticsRoutes } from './presentation/analytics.routes.js';

export interface AnalyticsModuleDependencies {
  analyticsQueryRepository: AnalyticsQueryRepository;
  branchRepository: BranchRepository;
  warehouseRepository: WarehouseRepository;
  vehicleRepository: VehicleRepository;
  employeeRepository: EmployeeRepository;
}

export function buildAnalyticsController(deps: AnalyticsModuleDependencies): AnalyticsController {
  const periodResolver = new AnalyticsPeriodResolverService();
  const filterValidator = new AnalyticsFilterValidatorService(
    deps.branchRepository,
    deps.warehouseRepository,
    deps.vehicleRepository,
    deps.employeeRepository,
  );
  const filterPipeline = new AnalyticsFilterPipeline(periodResolver, filterValidator);

  return new AnalyticsController(
    new GetCompanyAnalyticsUseCase(deps.analyticsQueryRepository, filterPipeline),
    new GetTransactionAnalyticsUseCase(deps.analyticsQueryRepository, filterPipeline),
    new GetTripAnalyticsUseCase(deps.analyticsQueryRepository, filterPipeline),
    new GetExpenseAnalyticsUseCase(deps.analyticsQueryRepository, filterPipeline),
    new GetWorkforceAnalyticsUseCase(deps.analyticsQueryRepository, filterPipeline),
    new GetOrganizationAnalyticsUseCase(deps.analyticsQueryRepository, filterPipeline),
  );
}
