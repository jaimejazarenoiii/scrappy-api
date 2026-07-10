import { Router } from 'express';
import { authorize } from '../../../middleware/authorization.middleware.js';
import { validate } from '../../../middleware/validation.middleware.js';
import type { ReportsController } from './reports.controller.js';
import {
  attendanceReportExportQuerySchema,
  attendanceReportQuerySchema,
  branchReportExportQuerySchema,
  branchReportQuerySchema,
  cashAdvanceReportExportQuerySchema,
  cashAdvanceReportQuerySchema,
  employeeReportExportQuerySchema,
  employeeReportQuerySchema,
  expenseReportExportQuerySchema,
  expenseReportQuerySchema,
  leaveReportExportQuerySchema,
  leaveReportQuerySchema,
  payrollReportExportQuerySchema,
  payrollReportQuerySchema,
  transactionReportExportQuerySchema,
  transactionReportQuerySchema,
  tripReportExportQuerySchema,
  tripReportQuerySchema,
  vehicleReportExportQuerySchema,
  vehicleReportQuerySchema,
  warehouseReportExportQuerySchema,
  warehouseReportQuerySchema,
} from './reports.schemas.js';

const MANAGER_ROLES = ['OWNER', 'MANAGER'] as const;

export function createReportsRoutes(controller: ReportsController): Router {
  const router = Router();

  router.get(
    '/reports/transactions',
    authorize([...MANAGER_ROLES]),
    validate(transactionReportQuerySchema, 'query'),
    controller.listTransactions,
  );
  router.get(
    '/reports/transactions/export',
    authorize([...MANAGER_ROLES]),
    validate(transactionReportExportQuerySchema, 'query'),
    controller.exportTransactions,
  );

  router.get(
    '/reports/trips',
    authorize([...MANAGER_ROLES]),
    validate(tripReportQuerySchema, 'query'),
    controller.listTrips,
  );
  router.get(
    '/reports/trips/export',
    authorize([...MANAGER_ROLES]),
    validate(tripReportExportQuerySchema, 'query'),
    controller.exportTrips,
  );

  router.get(
    '/reports/expenses',
    authorize([...MANAGER_ROLES]),
    validate(expenseReportQuerySchema, 'query'),
    controller.listExpenses,
  );
  router.get(
    '/reports/expenses/export',
    authorize([...MANAGER_ROLES]),
    validate(expenseReportExportQuerySchema, 'query'),
    controller.exportExpenses,
  );

  router.get(
    '/reports/attendance',
    authorize([...MANAGER_ROLES]),
    validate(attendanceReportQuerySchema, 'query'),
    controller.listAttendance,
  );
  router.get(
    '/reports/attendance/export',
    authorize([...MANAGER_ROLES]),
    validate(attendanceReportExportQuerySchema, 'query'),
    controller.exportAttendance,
  );

  router.get(
    '/reports/leave',
    authorize([...MANAGER_ROLES]),
    validate(leaveReportQuerySchema, 'query'),
    controller.listLeave,
  );
  router.get(
    '/reports/leave/export',
    authorize([...MANAGER_ROLES]),
    validate(leaveReportExportQuerySchema, 'query'),
    controller.exportLeave,
  );

  router.get(
    '/reports/cash-advances',
    authorize([...MANAGER_ROLES]),
    validate(cashAdvanceReportQuerySchema, 'query'),
    controller.listCashAdvances,
  );
  router.get(
    '/reports/cash-advances/export',
    authorize([...MANAGER_ROLES]),
    validate(cashAdvanceReportExportQuerySchema, 'query'),
    controller.exportCashAdvances,
  );

  router.get(
    '/reports/payroll',
    authorize([...MANAGER_ROLES]),
    validate(payrollReportQuerySchema, 'query'),
    controller.listPayroll,
  );
  router.get(
    '/reports/payroll/export',
    authorize([...MANAGER_ROLES]),
    validate(payrollReportExportQuerySchema, 'query'),
    controller.exportPayroll,
  );

  router.get(
    '/reports/employees',
    authorize([...MANAGER_ROLES]),
    validate(employeeReportQuerySchema, 'query'),
    controller.listEmployees,
  );
  router.get(
    '/reports/employees/export',
    authorize([...MANAGER_ROLES]),
    validate(employeeReportExportQuerySchema, 'query'),
    controller.exportEmployees,
  );

  router.get(
    '/reports/branches',
    authorize([...MANAGER_ROLES]),
    validate(branchReportQuerySchema, 'query'),
    controller.listBranches,
  );
  router.get(
    '/reports/branches/export',
    authorize([...MANAGER_ROLES]),
    validate(branchReportExportQuerySchema, 'query'),
    controller.exportBranches,
  );

  router.get(
    '/reports/warehouses',
    authorize([...MANAGER_ROLES]),
    validate(warehouseReportQuerySchema, 'query'),
    controller.listWarehouses,
  );
  router.get(
    '/reports/warehouses/export',
    authorize([...MANAGER_ROLES]),
    validate(warehouseReportExportQuerySchema, 'query'),
    controller.exportWarehouses,
  );

  router.get(
    '/reports/vehicles',
    authorize([...MANAGER_ROLES]),
    validate(vehicleReportQuerySchema, 'query'),
    controller.listVehicles,
  );
  router.get(
    '/reports/vehicles/export',
    authorize([...MANAGER_ROLES]),
    validate(vehicleReportExportQuerySchema, 'query'),
    controller.exportVehicles,
  );

  return router;
}
