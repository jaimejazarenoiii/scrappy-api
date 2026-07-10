import type { BranchRepository } from '../branch/domain/branch.repository.js';
import type { WarehouseRepository } from '../warehouse/domain/warehouse.repository.js';
import type { VehicleRepository } from '../vehicle/domain/vehicle.repository.js';
import type { EmployeeRepository } from '../employee/domain/employee.repository.js';
import type { CompanyRepository } from '../company/domain/company.repository.js';
import type { ReportsQueryRepository } from './domain/report-query.repository.js';
import { ReportFilterValidatorService } from './application/services/report-filter-validator.service.js';
import { ReportFilterPipeline } from './application/services/report-filter-pipeline.js';
import { ReportExportOrchestratorService } from './application/services/report-export-orchestrator.service.js';
import { CsvReportExporter } from './infrastructure/export/csv-report-exporter.js';
import { XlsxReportExporter } from './infrastructure/export/xlsx-report-exporter.js';
import { PdfReportExporter } from './infrastructure/export/pdf-report-exporter.js';
import { TripReferencePrismaChecker } from './infrastructure/trip-reference.prisma-checker.js';
import type { TripReferenceChecker } from './application/services/report-filter-validator.service.js';
import { ListTransactionReportUseCase } from './application/use-cases/list-transactions-report.use-case.js';
import { ExportTransactionReportUseCase } from './application/use-cases/export-transactions-report.use-case.js';
import { ListTripReportUseCase } from './application/use-cases/list-trips-report.use-case.js';
import { ExportTripReportUseCase } from './application/use-cases/export-trips-report.use-case.js';
import { ListExpenseReportUseCase } from './application/use-cases/list-expenses-report.use-case.js';
import { ExportExpenseReportUseCase } from './application/use-cases/export-expenses-report.use-case.js';
import { ListAttendanceReportUseCase } from './application/use-cases/list-attendance-report.use-case.js';
import { ExportAttendanceReportUseCase } from './application/use-cases/export-attendance-report.use-case.js';
import { ListLeaveReportUseCase } from './application/use-cases/list-leave-report.use-case.js';
import { ExportLeaveReportUseCase } from './application/use-cases/export-leave-report.use-case.js';
import { ListCashAdvanceReportUseCase } from './application/use-cases/list-cash-advances-report.use-case.js';
import { ExportCashAdvanceReportUseCase } from './application/use-cases/export-cash-advances-report.use-case.js';
import { ListPayrollReportUseCase } from './application/use-cases/list-payroll-report.use-case.js';
import { ExportPayrollReportUseCase } from './application/use-cases/export-payroll-report.use-case.js';
import { ListEmployeeReportUseCase } from './application/use-cases/list-employees-report.use-case.js';
import { ExportEmployeeReportUseCase } from './application/use-cases/export-employees-report.use-case.js';
import { ListBranchReportUseCase } from './application/use-cases/list-branches-report.use-case.js';
import { ExportBranchReportUseCase } from './application/use-cases/export-branches-report.use-case.js';
import { ListWarehouseReportUseCase } from './application/use-cases/list-warehouses-report.use-case.js';
import { ExportWarehouseReportUseCase } from './application/use-cases/export-warehouses-report.use-case.js';
import { ListVehicleReportUseCase } from './application/use-cases/list-vehicles-report.use-case.js';
import { ExportVehicleReportUseCase } from './application/use-cases/export-vehicles-report.use-case.js';
import { ReportsController } from './presentation/reports.controller.js';

export { createReportsRoutes } from './presentation/reports.routes.js';

export interface ReportsModuleDependencies {
  reportsQueryRepository: ReportsQueryRepository;
  branchRepository: BranchRepository;
  warehouseRepository: WarehouseRepository;
  vehicleRepository: VehicleRepository;
  employeeRepository: EmployeeRepository;
  companyRepository: CompanyRepository;
  tripReferenceChecker?: TripReferenceChecker;
}

export function buildReportsController(deps: ReportsModuleDependencies): ReportsController {
  const filterValidator = new ReportFilterValidatorService(
    deps.branchRepository,
    deps.warehouseRepository,
    deps.vehicleRepository,
    deps.employeeRepository,
    deps.tripReferenceChecker ?? new TripReferencePrismaChecker(),
  );
  const filterPipeline = new ReportFilterPipeline(filterValidator);
  const exportOrchestrator = new ReportExportOrchestratorService(
    new CsvReportExporter(),
    new XlsxReportExporter(),
    new PdfReportExporter(),
  );

  return new ReportsController(
    new ListTransactionReportUseCase(deps.reportsQueryRepository, filterPipeline),
    new ExportTransactionReportUseCase(
      deps.reportsQueryRepository,
      filterPipeline,
      exportOrchestrator,
      deps.companyRepository,
    ),
    new ListTripReportUseCase(deps.reportsQueryRepository, filterPipeline),
    new ExportTripReportUseCase(
      deps.reportsQueryRepository,
      filterPipeline,
      exportOrchestrator,
      deps.companyRepository,
    ),
    new ListExpenseReportUseCase(deps.reportsQueryRepository, filterPipeline),
    new ExportExpenseReportUseCase(
      deps.reportsQueryRepository,
      filterPipeline,
      exportOrchestrator,
      deps.companyRepository,
    ),
    new ListAttendanceReportUseCase(deps.reportsQueryRepository, filterPipeline),
    new ExportAttendanceReportUseCase(
      deps.reportsQueryRepository,
      filterPipeline,
      exportOrchestrator,
      deps.companyRepository,
    ),
    new ListLeaveReportUseCase(deps.reportsQueryRepository, filterPipeline),
    new ExportLeaveReportUseCase(
      deps.reportsQueryRepository,
      filterPipeline,
      exportOrchestrator,
      deps.companyRepository,
    ),
    new ListCashAdvanceReportUseCase(deps.reportsQueryRepository, filterPipeline),
    new ExportCashAdvanceReportUseCase(
      deps.reportsQueryRepository,
      filterPipeline,
      exportOrchestrator,
      deps.companyRepository,
    ),
    new ListPayrollReportUseCase(deps.reportsQueryRepository, filterPipeline),
    new ExportPayrollReportUseCase(
      deps.reportsQueryRepository,
      filterPipeline,
      exportOrchestrator,
      deps.companyRepository,
    ),
    new ListEmployeeReportUseCase(deps.reportsQueryRepository, filterPipeline),
    new ExportEmployeeReportUseCase(
      deps.reportsQueryRepository,
      filterPipeline,
      exportOrchestrator,
      deps.companyRepository,
    ),
    new ListBranchReportUseCase(deps.reportsQueryRepository, filterPipeline),
    new ExportBranchReportUseCase(
      deps.reportsQueryRepository,
      filterPipeline,
      exportOrchestrator,
      deps.companyRepository,
    ),
    new ListWarehouseReportUseCase(deps.reportsQueryRepository, filterPipeline),
    new ExportWarehouseReportUseCase(
      deps.reportsQueryRepository,
      filterPipeline,
      exportOrchestrator,
      deps.companyRepository,
    ),
    new ListVehicleReportUseCase(deps.reportsQueryRepository, filterPipeline),
    new ExportVehicleReportUseCase(
      deps.reportsQueryRepository,
      filterPipeline,
      exportOrchestrator,
      deps.companyRepository,
    ),
  );
}
