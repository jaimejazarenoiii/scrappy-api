import type { Request, RequestHandler } from 'express';
import { success } from '../../../shared/http/api-response.js';
import type { AuthorizationContext } from '../../../shared/policy/authorization-context.js';
import type { ListTransactionReportUseCase } from '../application/use-cases/list-transactions-report.use-case.js';
import type { ExportTransactionReportUseCase } from '../application/use-cases/export-transactions-report.use-case.js';
import type { ListTripReportUseCase } from '../application/use-cases/list-trips-report.use-case.js';
import type { ExportTripReportUseCase } from '../application/use-cases/export-trips-report.use-case.js';
import type { ListExpenseReportUseCase } from '../application/use-cases/list-expenses-report.use-case.js';
import type { ExportExpenseReportUseCase } from '../application/use-cases/export-expenses-report.use-case.js';
import type { ListAttendanceReportUseCase } from '../application/use-cases/list-attendance-report.use-case.js';
import type { ExportAttendanceReportUseCase } from '../application/use-cases/export-attendance-report.use-case.js';
import type { ListLeaveReportUseCase } from '../application/use-cases/list-leave-report.use-case.js';
import type { ExportLeaveReportUseCase } from '../application/use-cases/export-leave-report.use-case.js';
import type { ListCashAdvanceReportUseCase } from '../application/use-cases/list-cash-advances-report.use-case.js';
import type { ExportCashAdvanceReportUseCase } from '../application/use-cases/export-cash-advances-report.use-case.js';
import type { ListPayrollReportUseCase } from '../application/use-cases/list-payroll-report.use-case.js';
import type { ExportPayrollReportUseCase } from '../application/use-cases/export-payroll-report.use-case.js';
import type { ListEmployeeReportUseCase } from '../application/use-cases/list-employees-report.use-case.js';
import type { ExportEmployeeReportUseCase } from '../application/use-cases/export-employees-report.use-case.js';
import type { ListBranchReportUseCase } from '../application/use-cases/list-branches-report.use-case.js';
import type { ExportBranchReportUseCase } from '../application/use-cases/export-branches-report.use-case.js';
import type { ListWarehouseReportUseCase } from '../application/use-cases/list-warehouses-report.use-case.js';
import type { ExportWarehouseReportUseCase } from '../application/use-cases/export-warehouses-report.use-case.js';
import type { ListVehicleReportUseCase } from '../application/use-cases/list-vehicles-report.use-case.js';
import type { ExportVehicleReportUseCase } from '../application/use-cases/export-vehicles-report.use-case.js';

import type { ResolvedReportQuery } from '../application/services/report-filter-pipeline.js';
import type {
  AttendanceReportQuery,
  BranchReportQuery,
  CashAdvanceReportQuery,
  EmployeeReportQuery,
  ExpenseReportQuery,
  LeaveReportQuery,
  PayrollReportQuery,
  TransactionReportQuery,
  TripReportQuery,
  VehicleReportQuery,
  WarehouseReportQuery,
} from './reports.schemas.js';
import type { TransactionReportExportQuery } from '../application/use-cases/export-transactions-report.use-case.js';
import type { TripReportExportQuery } from '../application/use-cases/export-trips-report.use-case.js';
import type { ExpenseReportExportQuery } from '../application/use-cases/export-expenses-report.use-case.js';
import type { AttendanceReportExportQuery } from '../application/use-cases/export-attendance-report.use-case.js';
import type { LeaveReportExportQuery } from '../application/use-cases/export-leave-report.use-case.js';
import type { CashAdvanceReportExportQuery } from '../application/use-cases/export-cash-advances-report.use-case.js';
import type { PayrollReportExportQuery } from '../application/use-cases/export-payroll-report.use-case.js';
import type { EmployeeReportExportQuery } from '../application/use-cases/export-employees-report.use-case.js';
import type { BranchReportExportQuery } from '../application/use-cases/export-branches-report.use-case.js';
import type { WarehouseReportExportQuery } from '../application/use-cases/export-warehouses-report.use-case.js';
import type { VehicleReportExportQuery } from '../application/use-cases/export-vehicles-report.use-case.js';

function queryFromRequest<T extends ResolvedReportQuery>(req: Request): T {
  return req.validatedQuery as T;
}

function authContext(req: Request): AuthorizationContext {
  return {
    companyId: req.auth!.companyId,
    userId: req.auth!.userId,
    role: req.auth!.role,
  };
}

function streamExport(
  res: Parameters<RequestHandler>[1],
  artifact: Awaited<ReturnType<ExportTransactionReportUseCase['execute']>>,
): void {
  res.setHeader('Content-Type', artifact.contentType);
  res.setHeader('Content-Disposition', `${artifact.disposition}; filename="${artifact.filename}"`);
  artifact.stream.pipe(res);
}

export class ReportsController {
  constructor(
    private readonly listTransactionReportUseCase: ListTransactionReportUseCase,
    private readonly exportTransactionReportUseCase: ExportTransactionReportUseCase,
    private readonly listTripReportUseCase: ListTripReportUseCase,
    private readonly exportTripReportUseCase: ExportTripReportUseCase,
    private readonly listExpenseReportUseCase: ListExpenseReportUseCase,
    private readonly exportExpenseReportUseCase: ExportExpenseReportUseCase,
    private readonly listAttendanceReportUseCase: ListAttendanceReportUseCase,
    private readonly exportAttendanceReportUseCase: ExportAttendanceReportUseCase,
    private readonly listLeaveReportUseCase: ListLeaveReportUseCase,
    private readonly exportLeaveReportUseCase: ExportLeaveReportUseCase,
    private readonly listCashAdvanceReportUseCase: ListCashAdvanceReportUseCase,
    private readonly exportCashAdvanceReportUseCase: ExportCashAdvanceReportUseCase,
    private readonly listPayrollReportUseCase: ListPayrollReportUseCase,
    private readonly exportPayrollReportUseCase: ExportPayrollReportUseCase,
    private readonly listEmployeeReportUseCase: ListEmployeeReportUseCase,
    private readonly exportEmployeeReportUseCase: ExportEmployeeReportUseCase,
    private readonly listBranchReportUseCase: ListBranchReportUseCase,
    private readonly exportBranchReportUseCase: ExportBranchReportUseCase,
    private readonly listWarehouseReportUseCase: ListWarehouseReportUseCase,
    private readonly exportWarehouseReportUseCase: ExportWarehouseReportUseCase,
    private readonly listVehicleReportUseCase: ListVehicleReportUseCase,
    private readonly exportVehicleReportUseCase: ExportVehicleReportUseCase,
  ) {}

  listTransactions: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listTransactionReportUseCase.execute(
        authContext(req),
        queryFromRequest<TransactionReportQuery>(req),
      );
      res.json(
        success(
          {
            items: result.items,
            appliedCriteria: result.appliedCriteria,
            generatedAt: result.generatedAt,
          },
          { ...result.meta },
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  exportTransactions: RequestHandler = async (req, res, next) => {
    try {
      streamExport(
        res,
        await this.exportTransactionReportUseCase.execute(
          authContext(req),
          queryFromRequest<TransactionReportExportQuery>(req),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  listTrips: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listTripReportUseCase.execute(
        authContext(req),
        queryFromRequest<TripReportQuery>(req),
      );
      res.json(
        success(
          {
            items: result.items,
            appliedCriteria: result.appliedCriteria,
            generatedAt: result.generatedAt,
          },
          { ...result.meta },
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  exportTrips: RequestHandler = async (req, res, next) => {
    try {
      streamExport(
        res,
        await this.exportTripReportUseCase.execute(
          authContext(req),
          queryFromRequest<TripReportExportQuery>(req),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  listExpenses: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listExpenseReportUseCase.execute(
        authContext(req),
        queryFromRequest<ExpenseReportQuery>(req),
      );
      res.json(
        success(
          {
            items: result.items,
            appliedCriteria: result.appliedCriteria,
            generatedAt: result.generatedAt,
          },
          { ...result.meta },
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  exportExpenses: RequestHandler = async (req, res, next) => {
    try {
      streamExport(
        res,
        await this.exportExpenseReportUseCase.execute(
          authContext(req),
          queryFromRequest<ExpenseReportExportQuery>(req),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  listAttendance: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listAttendanceReportUseCase.execute(
        authContext(req),
        queryFromRequest<AttendanceReportQuery>(req),
      );
      res.json(
        success(
          {
            items: result.items,
            appliedCriteria: result.appliedCriteria,
            generatedAt: result.generatedAt,
          },
          { ...result.meta },
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  exportAttendance: RequestHandler = async (req, res, next) => {
    try {
      streamExport(
        res,
        await this.exportAttendanceReportUseCase.execute(
          authContext(req),
          queryFromRequest<AttendanceReportExportQuery>(req),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  listLeave: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listLeaveReportUseCase.execute(
        authContext(req),
        queryFromRequest<LeaveReportQuery>(req),
      );
      res.json(
        success(
          {
            items: result.items,
            appliedCriteria: result.appliedCriteria,
            generatedAt: result.generatedAt,
          },
          { ...result.meta },
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  exportLeave: RequestHandler = async (req, res, next) => {
    try {
      streamExport(
        res,
        await this.exportLeaveReportUseCase.execute(
          authContext(req),
          queryFromRequest<LeaveReportExportQuery>(req),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  listCashAdvances: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listCashAdvanceReportUseCase.execute(
        authContext(req),
        queryFromRequest<CashAdvanceReportQuery>(req),
      );
      res.json(
        success(
          {
            items: result.items,
            appliedCriteria: result.appliedCriteria,
            generatedAt: result.generatedAt,
          },
          { ...result.meta },
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  exportCashAdvances: RequestHandler = async (req, res, next) => {
    try {
      streamExport(
        res,
        await this.exportCashAdvanceReportUseCase.execute(
          authContext(req),
          queryFromRequest<CashAdvanceReportExportQuery>(req),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  listPayroll: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listPayrollReportUseCase.execute(
        authContext(req),
        queryFromRequest<PayrollReportQuery>(req),
      );
      res.json(
        success(
          {
            items: result.items,
            appliedCriteria: result.appliedCriteria,
            generatedAt: result.generatedAt,
          },
          { ...result.meta },
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  exportPayroll: RequestHandler = async (req, res, next) => {
    try {
      streamExport(
        res,
        await this.exportPayrollReportUseCase.execute(
          authContext(req),
          queryFromRequest<PayrollReportExportQuery>(req),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  listEmployees: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listEmployeeReportUseCase.execute(
        authContext(req),
        queryFromRequest<EmployeeReportQuery>(req),
      );
      res.json(
        success(
          {
            items: result.items,
            appliedCriteria: result.appliedCriteria,
            generatedAt: result.generatedAt,
          },
          { ...result.meta },
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  exportEmployees: RequestHandler = async (req, res, next) => {
    try {
      streamExport(
        res,
        await this.exportEmployeeReportUseCase.execute(
          authContext(req),
          queryFromRequest<EmployeeReportExportQuery>(req),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  listBranches: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listBranchReportUseCase.execute(
        authContext(req),
        queryFromRequest<BranchReportQuery>(req),
      );
      res.json(
        success(
          {
            items: result.items,
            appliedCriteria: result.appliedCriteria,
            generatedAt: result.generatedAt,
          },
          { ...result.meta },
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  exportBranches: RequestHandler = async (req, res, next) => {
    try {
      streamExport(
        res,
        await this.exportBranchReportUseCase.execute(
          authContext(req),
          queryFromRequest<BranchReportExportQuery>(req),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  listWarehouses: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listWarehouseReportUseCase.execute(
        authContext(req),
        queryFromRequest<WarehouseReportQuery>(req),
      );
      res.json(
        success(
          {
            items: result.items,
            appliedCriteria: result.appliedCriteria,
            generatedAt: result.generatedAt,
          },
          { ...result.meta },
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  exportWarehouses: RequestHandler = async (req, res, next) => {
    try {
      streamExport(
        res,
        await this.exportWarehouseReportUseCase.execute(
          authContext(req),
          queryFromRequest<WarehouseReportExportQuery>(req),
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  listVehicles: RequestHandler = async (req, res, next) => {
    try {
      const result = await this.listVehicleReportUseCase.execute(
        authContext(req),
        queryFromRequest<VehicleReportQuery>(req),
      );
      res.json(
        success(
          {
            items: result.items,
            appliedCriteria: result.appliedCriteria,
            generatedAt: result.generatedAt,
          },
          { ...result.meta },
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  exportVehicles: RequestHandler = async (req, res, next) => {
    try {
      streamExport(
        res,
        await this.exportVehicleReportUseCase.execute(
          authContext(req),
          queryFromRequest<VehicleReportExportQuery>(req),
        ),
      );
    } catch (error) {
      next(error);
    }
  };
}
