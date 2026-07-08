import {
  protectedOperation,
  queryParam,
  successResponse,
} from '../../../swagger/openapi-helpers.js';

const TAG = 'Analytics';

const analyticsQueryParams = [
  queryParam('period', {
    type: 'string',
    enum: ['TODAY', 'YESTERDAY', 'THIS_WEEK', 'THIS_MONTH', 'THIS_YEAR', 'CUSTOM'],
    default: 'THIS_MONTH',
  }),
  queryParam('from', { type: 'string', format: 'date-time' }),
  queryParam('to', { type: 'string', format: 'date-time' }),
  queryParam('branchId', { type: 'string', format: 'uuid' }),
  queryParam('warehouseId', { type: 'string', format: 'uuid' }),
  queryParam('vehicleId', { type: 'string', format: 'uuid' }),
  queryParam('employeeId', { type: 'string', format: 'uuid' }),
  queryParam('includeArchived', { type: 'boolean', default: false }),
  queryParam('limit', { type: 'integer', minimum: 1, maximum: 25, default: 10 }),
];

export const analyticsOpenApiPaths = {
  '/api/v1/analytics/company': {
    get: protectedOperation({
      tags: [TAG],
      summary: 'Company analytics dashboard',
      parameters: analyticsQueryParams,
      responses: { ...successResponse('CompanyAnalytics', 'Company analytics snapshot') },
    }),
  },
  '/api/v1/analytics/transactions': {
    get: protectedOperation({
      tags: [TAG],
      summary: 'Transaction analytics dashboard',
      parameters: analyticsQueryParams,
      responses: { ...successResponse('TransactionAnalytics', 'Transaction analytics') },
    }),
  },
  '/api/v1/analytics/trips': {
    get: protectedOperation({
      tags: [TAG],
      summary: 'Trip analytics dashboard',
      parameters: analyticsQueryParams,
      responses: { ...successResponse('TripAnalytics', 'Trip analytics') },
    }),
  },
  '/api/v1/analytics/expenses': {
    get: protectedOperation({
      tags: [TAG],
      summary: 'Expense analytics dashboard',
      parameters: analyticsQueryParams,
      responses: { ...successResponse('ExpenseAnalytics', 'Expense analytics') },
    }),
  },
  '/api/v1/analytics/workforce': {
    get: protectedOperation({
      tags: [TAG],
      summary: 'Workforce analytics dashboard',
      parameters: analyticsQueryParams,
      responses: { ...successResponse('WorkforceAnalytics', 'Workforce analytics') },
    }),
  },
  '/api/v1/analytics/organization': {
    get: protectedOperation({
      tags: [TAG],
      summary: 'Organization analytics dashboard',
      parameters: analyticsQueryParams,
      responses: { ...successResponse('OrganizationAnalytics', 'Organization analytics') },
    }),
  },
};
