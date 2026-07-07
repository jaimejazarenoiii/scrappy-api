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
      summary: 'Request leave',
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
      responses: { ...paginatedListResponse('LeaveRecord', 'Company leave records') },
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
