import {
  jsonRequestBody,
  paginatedListResponse,
  protectedOperation,
  queryParam,
  successResponse,
  uuidPathParam,
} from '../../../swagger/openapi-helpers.js';

export const leaveOpenApiPaths = {
  '/api/v1/workforce/leave': {
    post: protectedOperation({
      tags: ['Leave'],
      summary: 'Request leave (self-service or on behalf of an employee)',
      requestBody: jsonRequestBody('RequestLeaveBody'),
      responses: { ...successResponse('LeaveRecord', 'Leave record created', '201') },
    }),
    get: protectedOperation({
      tags: ['Leave'],
      summary: 'My leave history',
      parameters: [
        queryParam('page', { type: 'integer', default: 1 }),
        queryParam('limit', { type: 'integer', default: 20 }),
        queryParam('status', {
          type: 'string',
          enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
        }),
        queryParam('sortBy', { type: 'string', enum: ['leaveDate', 'createdAt'] }),
        queryParam('sortOrder', { type: 'string', enum: ['asc', 'desc'] }),
        queryParam('fromDate', { type: 'string', format: 'date' }),
        queryParam('toDate', { type: 'string', format: 'date' }),
      ],
      responses: { ...paginatedListResponse('LeaveRecord', 'Leave history') },
    }),
  },
  '/api/v1/workforce/leave/company': {
    get: protectedOperation({
      tags: ['Leave'],
      summary: 'Company leave records',
      parameters: [
        queryParam('employeeId', { type: 'string', format: 'uuid' }),
        queryParam('status', {
          type: 'string',
          enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
        }),
        queryParam('page', { type: 'integer', default: 1 }),
        queryParam('limit', { type: 'integer', default: 20 }),
        queryParam('fromDate', { type: 'string', format: 'date' }),
        queryParam('toDate', { type: 'string', format: 'date' }),
      ],
      responses: { ...paginatedListResponse('CompanyLeaveRecord', 'Company leave records') },
    }),
  },
  '/api/v1/workforce/leave/dashboard': {
    get: protectedOperation({
      tags: ['Leave'],
      summary: 'Leave dashboard for owners and managers',
      parameters: [queryParam('date', { type: 'string', format: 'date' })],
      responses: { ...successResponse('LeaveDashboard', 'Leave dashboard') },
    }),
  },
  '/api/v1/workforce/leave/{leaveId}': {
    patch: protectedOperation({
      tags: ['Leave'],
      summary: 'Manage leave record',
      parameters: [uuidPathParam('leaveId', 'Leave identifier')],
      requestBody: jsonRequestBody('ManageLeaveRequest'),
      responses: { ...successResponse('LeaveRecord', 'Updated leave record') },
    }),
  },
};
