import {
  jsonRequestBody,
  paginatedListResponse,
  protectedOperation,
  queryParam,
  successResponse,
  uuidPathParam,
} from '../../../swagger/openapi-helpers.js';

export const payrollOpenApiPaths = {
  '/api/v1/workforce/payroll': {
    post: protectedOperation({
      tags: ['Payroll'],
      summary: 'Generate weekly payroll',
      requestBody: jsonRequestBody('GeneratePayrollRequest'),
      responses: {
        ...successResponse('GeneratePayrollResponse', 'Payroll batch generated', '201'),
      },
    }),
    get: protectedOperation({
      tags: ['Payroll'],
      summary: 'Payroll history',
      parameters: [
        queryParam('employeeId', { type: 'string', format: 'uuid' }),
        queryParam('payPeriodStart', { type: 'string', format: 'date' }),
        queryParam('payPeriodEnd', { type: 'string', format: 'date' }),
        queryParam('page', { type: 'integer', default: 1 }),
        queryParam('limit', { type: 'integer', default: 20 }),
        queryParam('sortBy', { type: 'string', enum: ['payPeriodStart', 'createdAt', 'status'] }),
        queryParam('sortOrder', { type: 'string', enum: ['asc', 'desc'] }),
      ],
      responses: { ...paginatedListResponse('PayrollRecord', 'Payroll history') },
    }),
  },
  '/api/v1/workforce/payroll/{payrollId}': {
    get: protectedOperation({
      tags: ['Payroll'],
      summary: 'View payroll record',
      parameters: [uuidPathParam('payrollId', 'Payroll identifier')],
      responses: { ...successResponse('PayrollRecord', 'Payroll record details') },
    }),
  },
  '/api/v1/workforce/payroll/{payrollId}/mark-paid': {
    post: protectedOperation({
      tags: ['Payroll'],
      summary: 'Mark payroll as paid',
      parameters: [uuidPathParam('payrollId', 'Payroll identifier')],
      requestBody: jsonRequestBody('MarkPayrollPaidRequest', false),
      responses: { ...successResponse('PayrollRecord', 'Payroll marked paid') },
    }),
  },
};
