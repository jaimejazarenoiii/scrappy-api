import {
  protectedOperation,
  queryParam,
  successResponse,
} from '../../../swagger/openapi-helpers.js';

const TAG = 'Reports';

const entityFilterParams = [
  queryParam('branchId', { type: 'string', format: 'uuid' }),
  queryParam('warehouseId', { type: 'string', format: 'uuid' }),
  queryParam('vehicleId', { type: 'string', format: 'uuid' }),
  queryParam('employeeId', { type: 'string', format: 'uuid' }),
  queryParam('tripId', { type: 'string', format: 'uuid' }),
  queryParam('includeArchived', { type: 'boolean', default: false }),
  queryParam('search', { type: 'string', minLength: 2 }),
  queryParam('page', { type: 'integer', minimum: 1, default: 1 }),
  queryParam('limit', { type: 'integer', minimum: 1, maximum: 100, default: 20 }),
  queryParam('sortOrder', { type: 'string', enum: ['asc', 'desc'], default: 'desc' }),
];

const requiredDateParams = [
  queryParam('from', { type: 'string', format: 'date-time' }, undefined, true),
  queryParam('to', { type: 'string', format: 'date-time' }, undefined, true),
];

const optionalDateParams = [
  queryParam('from', { type: 'string', format: 'date-time' }),
  queryParam('to', { type: 'string', format: 'date-time' }),
];

const exportParams = [
  queryParam('format', { type: 'string', enum: ['csv', 'xlsx', 'pdf'] }, undefined, true),
  queryParam('disposition', {
    type: 'string',
    enum: ['attachment', 'inline'],
    default: 'attachment',
  }),
];

const binaryExportResponses = {
  '200': {
    description: 'Exported report file',
    content: {
      'text/csv': { schema: { type: 'string', format: 'binary' } },
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
        schema: { type: 'string', format: 'binary' },
      },
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
    },
  },
};

function listPath(
  path: string,
  summary: string,
  schema: string,
  extraParams: ReturnType<typeof queryParam>[] = [],
) {
  return {
    get: protectedOperation({
      tags: [TAG],
      summary,
      parameters: [...requiredDateParams, ...entityFilterParams, ...extraParams],
      responses: { ...successResponse(schema, summary) },
    }),
  };
}

function optionalListPath(
  path: string,
  summary: string,
  schema: string,
  extraParams: ReturnType<typeof queryParam>[] = [],
) {
  return {
    get: protectedOperation({
      tags: [TAG],
      summary,
      parameters: [...optionalDateParams, ...entityFilterParams, ...extraParams],
      responses: { ...successResponse(schema, summary) },
    }),
  };
}

function exportPath(
  summary: string,
  extraParams: ReturnType<typeof queryParam>[] = [],
  requiredDates = true,
) {
  return {
    get: protectedOperation({
      tags: [TAG],
      summary,
      parameters: [
        ...(requiredDates ? requiredDateParams : optionalDateParams),
        ...entityFilterParams,
        ...extraParams,
        ...exportParams,
      ],
      responses: binaryExportResponses,
    }),
  };
}

export const reportsOpenApiPaths = {
  '/api/v1/reports/transactions': listPath(
    '/api/v1/reports/transactions',
    'List transaction report',
    'TransactionReportList',
    [
      queryParam('sortBy', {
        type: 'string',
        enum: ['transactionDate', 'transactionNumber', 'createdAt', 'partyName', 'status'],
        default: 'transactionDate',
      }),
      queryParam('direction', { type: 'string', enum: ['INBOUND', 'OUTBOUND'] }),
      queryParam('status', {
        type: 'string',
        enum: ['DRAFT', 'FINISHED', 'SUBMITTED', 'PAID', 'CANCELLED', 'REOPENED'],
      }),
      queryParam('transactionNumber', { type: 'string' }),
    ],
  ),
  '/api/v1/reports/transactions/export': exportPath('Export transaction report', [
    queryParam('sortBy', {
      type: 'string',
      enum: ['transactionDate', 'transactionNumber', 'createdAt', 'partyName', 'status'],
      default: 'transactionDate',
    }),
    queryParam('direction', { type: 'string', enum: ['INBOUND', 'OUTBOUND'] }),
    queryParam('status', {
      type: 'string',
      enum: ['DRAFT', 'FINISHED', 'SUBMITTED', 'PAID', 'CANCELLED', 'REOPENED'],
    }),
    queryParam('transactionNumber', { type: 'string' }),
  ]),
  '/api/v1/reports/trips': listPath('/api/v1/reports/trips', 'List trip report', 'TripReportList', [
    queryParam('sortBy', {
      type: 'string',
      enum: ['scheduledStart', 'tripNumber', 'status', 'createdAt'],
      default: 'scheduledStart',
    }),
    queryParam('status', {
      type: 'string',
      enum: ['DRAFT', 'SCHEDULED', 'STARTED', 'COMPLETED', 'CANCELLED'],
    }),
  ]),
  '/api/v1/reports/trips/export': exportPath('Export trip report', [
    queryParam('sortBy', {
      type: 'string',
      enum: ['scheduledStart', 'tripNumber', 'status', 'createdAt'],
      default: 'scheduledStart',
    }),
  ]),
  '/api/v1/reports/expenses': listPath(
    '/api/v1/reports/expenses',
    'List expense report',
    'ExpenseReportList',
    [
      queryParam('sortBy', {
        type: 'string',
        enum: ['date', 'category', 'amount'],
        default: 'date',
      }),
      queryParam('category', { type: 'string' }),
      queryParam('referenceType', { type: 'string' }),
    ],
  ),
  '/api/v1/reports/expenses/export': exportPath('Export expense report', [
    queryParam('sortBy', { type: 'string', enum: ['date', 'category', 'amount'], default: 'date' }),
  ]),
  '/api/v1/reports/attendance': listPath(
    '/api/v1/reports/attendance',
    'List attendance report',
    'AttendanceReportList',
    [queryParam('sortBy', { type: 'string', enum: ['timeInAt', 'status'], default: 'timeInAt' })],
  ),
  '/api/v1/reports/attendance/export': exportPath('Export attendance report', [
    queryParam('sortBy', { type: 'string', enum: ['timeInAt', 'status'], default: 'timeInAt' }),
  ]),
  '/api/v1/reports/leave': listPath(
    '/api/v1/reports/leave',
    'List leave report',
    'LeaveReportList',
    [
      queryParam('sortBy', {
        type: 'string',
        enum: ['leaveDate', 'leaveType', 'status'],
        default: 'leaveDate',
      }),
    ],
  ),
  '/api/v1/reports/leave/export': exportPath('Export leave report'),
  '/api/v1/reports/cash-advances': listPath(
    '/api/v1/reports/cash-advances',
    'List cash advance report',
    'CashAdvanceReportList',
    [
      queryParam('sortBy', {
        type: 'string',
        enum: ['createdAt', 'amount', 'status'],
        default: 'createdAt',
      }),
    ],
  ),
  '/api/v1/reports/cash-advances/export': exportPath('Export cash advance report'),
  '/api/v1/reports/payroll': listPath(
    '/api/v1/reports/payroll',
    'List payroll report',
    'PayrollReportList',
    [
      queryParam('sortBy', {
        type: 'string',
        enum: ['payPeriodStart', 'payPeriodEnd', 'status'],
        default: 'payPeriodStart',
      }),
    ],
  ),
  '/api/v1/reports/payroll/export': exportPath('Export payroll report'),
  '/api/v1/reports/employees': optionalListPath(
    '/api/v1/reports/employees',
    'List employee report',
    'EmployeeReportList',
    [
      queryParam('sortBy', {
        type: 'string',
        enum: ['lastName', 'firstName', 'createdAt', 'employeeNumber'],
        default: 'lastName',
      }),
    ],
  ),
  '/api/v1/reports/employees/export': exportPath(
    'Export employee report',
    [
      queryParam('sortBy', {
        type: 'string',
        enum: ['lastName', 'firstName', 'createdAt', 'employeeNumber'],
        default: 'lastName',
      }),
    ],
    false,
  ),
  '/api/v1/reports/branches': optionalListPath(
    '/api/v1/reports/branches',
    'List branch report',
    'BranchReportList',
    [
      queryParam('sortBy', {
        type: 'string',
        enum: ['name', 'createdAt', 'status'],
        default: 'name',
      }),
    ],
  ),
  '/api/v1/reports/branches/export': exportPath(
    'Export branch report',
    [
      queryParam('sortBy', {
        type: 'string',
        enum: ['name', 'createdAt', 'status'],
        default: 'name',
      }),
    ],
    false,
  ),
  '/api/v1/reports/warehouses': optionalListPath(
    '/api/v1/reports/warehouses',
    'List warehouse report',
    'WarehouseReportList',
    [
      queryParam('sortBy', {
        type: 'string',
        enum: ['name', 'createdAt', 'status'],
        default: 'name',
      }),
    ],
  ),
  '/api/v1/reports/warehouses/export': exportPath(
    'Export warehouse report',
    [
      queryParam('sortBy', {
        type: 'string',
        enum: ['name', 'createdAt', 'status'],
        default: 'name',
      }),
    ],
    false,
  ),
  '/api/v1/reports/vehicles': optionalListPath(
    '/api/v1/reports/vehicles',
    'List vehicle report',
    'VehicleReportList',
    [
      queryParam('sortBy', {
        type: 'string',
        enum: ['plateNumber', 'createdAt', 'status'],
        default: 'plateNumber',
      }),
    ],
  ),
  '/api/v1/reports/vehicles/export': exportPath(
    'Export vehicle report',
    [
      queryParam('sortBy', {
        type: 'string',
        enum: ['plateNumber', 'createdAt', 'status'],
        default: 'plateNumber',
      }),
    ],
    false,
  ),
};
