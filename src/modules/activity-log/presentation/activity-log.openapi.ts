import {
  paginatedListResponse,
  protectedOperation,
  queryParam,
  successResponse,
  uuidPathParam,
} from '../../../swagger/openapi-helpers.js';

export const activityLogOpenApiPaths = {
  '/api/v1/activity-logs': {
    get: protectedOperation({
      tags: ['Activity Logs'],
      summary: 'List Activity Logs',
      description:
        'Searchable, filterable, sortable, paginated Activity Logs for the authenticated Company. Owner and Manager only.',
      parameters: [
        queryParam('q', { type: 'string', minLength: 1, maxLength: 200 }),
        queryParam('searchBy', {
          type: 'string',
          enum: [
            'employeeName',
            'transactionNumber',
            'tripNumber',
            'expenseNumber',
            'user',
            'action',
          ],
        }),
        queryParam('module', { $ref: '#/components/schemas/ActivityModule' }),
        queryParam('action', { type: 'string' }),
        queryParam('userId', { type: 'string', format: 'uuid' }),
        queryParam('eventType', { $ref: '#/components/schemas/ActivityEventType' }),
        queryParam('dateFrom', { type: 'string', format: 'date-time' }),
        queryParam('dateTo', { type: 'string', format: 'date-time' }),
        queryParam('page', { type: 'integer', minimum: 1, default: 1 }),
        queryParam('limit', { type: 'integer', minimum: 1, maximum: 100, default: 20 }),
        queryParam('sortBy', {
          type: 'string',
          enum: ['createdAt', 'module', 'user'],
          default: 'createdAt',
        }),
        queryParam('sortOrder', { type: 'string', enum: ['asc', 'desc'], default: 'desc' }),
      ],
      responses: {
        ...paginatedListResponse('ActivityLog', 'Paginated Activity Logs'),
      },
    }),
  },
  '/api/v1/activity-logs/{activityLogId}': {
    get: protectedOperation({
      tags: ['Activity Logs'],
      summary: 'Get Activity Log by id',
      parameters: [uuidPathParam('activityLogId', 'Activity Log identifier')],
      responses: {
        ...successResponse('ActivityLog', 'Activity Log detail'),
      },
    }),
  },
};
