export const REPORTS_LIST_ROUTES = [
  '/api/v1/reports/transactions',
  '/api/v1/reports/trips',
  '/api/v1/reports/expenses',
  '/api/v1/reports/attendance',
  '/api/v1/reports/leave',
  '/api/v1/reports/cash-advances',
  '/api/v1/reports/payroll',
  '/api/v1/reports/employees',
  '/api/v1/reports/branches',
  '/api/v1/reports/warehouses',
  '/api/v1/reports/vehicles',
] as const;

export const REPORTS_EXPORT_ROUTES = [
  '/api/v1/reports/transactions/export',
  '/api/v1/reports/trips/export',
  '/api/v1/reports/expenses/export',
  '/api/v1/reports/attendance/export',
  '/api/v1/reports/leave/export',
  '/api/v1/reports/cash-advances/export',
  '/api/v1/reports/payroll/export',
  '/api/v1/reports/employees/export',
  '/api/v1/reports/branches/export',
  '/api/v1/reports/warehouses/export',
  '/api/v1/reports/vehicles/export',
] as const;

export const REPORTS_ROUTES = [...REPORTS_LIST_ROUTES, ...REPORTS_EXPORT_ROUTES] as const;

export function reportDateRangeQuery(): string {
  return 'from=2026-01-01T00:00:00.000Z&to=2026-12-31T23:59:59.999Z';
}
