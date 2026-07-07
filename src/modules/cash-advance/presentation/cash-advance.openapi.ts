import {
  jsonRequestBody,
  paginatedListResponse,
  protectedOperation,
  queryParam,
  successResponse,
} from '../../../swagger/openapi-helpers.js';

export const cashAdvanceOpenApiPaths = {
  '/api/v1/workforce/cash-advances': {
    post: protectedOperation({
      tags: ['Cash Advances'],
      summary: 'Create cash advance',
      requestBody: jsonRequestBody('CreateCashAdvanceRequest'),
      responses: { ...successResponse('CashAdvance', 'Cash advance created', '201') },
    }),
    get: protectedOperation({
      tags: ['Cash Advances'],
      summary: 'My cash advance history',
      parameters: [
        queryParam('page', { type: 'integer', default: 1 }),
        queryParam('limit', { type: 'integer', default: 20 }),
        queryParam('status', { type: 'string', enum: ['OUTSTANDING', 'SETTLED'] }),
        queryParam('fromDate', { type: 'string', format: 'date' }),
        queryParam('toDate', { type: 'string', format: 'date' }),
      ],
      responses: { ...paginatedListResponse('CashAdvance', 'Cash advance history') },
    }),
  },
  '/api/v1/workforce/cash-advances/company': {
    get: protectedOperation({
      tags: ['Cash Advances'],
      summary: 'Company cash advances',
      parameters: [
        queryParam('employeeId', { type: 'string', format: 'uuid' }),
        queryParam('page', { type: 'integer', default: 1 }),
        queryParam('limit', { type: 'integer', default: 20 }),
        queryParam('status', { type: 'string', enum: ['OUTSTANDING', 'SETTLED'] }),
        queryParam('fromDate', { type: 'string', format: 'date' }),
        queryParam('toDate', { type: 'string', format: 'date' }),
      ],
      responses: { ...paginatedListResponse('CashAdvance', 'Company cash advances') },
    }),
  },
};
