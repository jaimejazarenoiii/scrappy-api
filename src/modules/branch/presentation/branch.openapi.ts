import {
  jsonRequestBody,
  paginatedListResponse,
  protectedOperation,
  queryParam,
  successResponse,
  uuidPathParam,
} from '../../../swagger/openapi-helpers.js';

const locationListParams = [
  queryParam('sortBy', { type: 'string', enum: ['name', 'createdAt', 'status'] }, 'Sort field'),
  queryParam('status', { type: 'string', enum: ['ACTIVE', 'INACTIVE'] }, 'Filter by status'),
];

export const branchOpenApiPaths = {
  '/api/v1/branches': {
    get: protectedOperation({
      tags: ['Branches'],
      summary: 'List operational branches',
      description:
        'Returns paginated active branches for the authenticated company. Archived branches are excluded.',
      parameters: [
        ...[
          queryParam('page', { type: 'integer', minimum: 1, default: 1 }, 'Page number'),
          queryParam(
            'limit',
            { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            'Page size',
          ),
          queryParam('sortOrder', { type: 'string', enum: ['asc', 'desc'], default: 'asc' }),
          queryParam('search', { type: 'string' }, 'Search name, address, or contact number'),
        ],
        ...locationListParams,
      ],
      responses: {
        ...paginatedListResponse('Branch', 'Branch list'),
      },
    }),
    post: protectedOperation({
      tags: ['Branches'],
      summary: 'Create branch',
      description: 'Creates a branch in the authenticated company. Requires Owner or Manager role.',
      requestBody: jsonRequestBody('CreateBranchRequest'),
      responses: {
        ...successResponse('Branch', 'Branch created', '201'),
      },
    }),
  },
  '/api/v1/branches/{branchId}': {
    get: protectedOperation({
      tags: ['Branches'],
      summary: 'Get branch by ID',
      parameters: [uuidPathParam('branchId', 'Branch identifier')],
      responses: {
        ...successResponse('Branch', 'Branch details'),
      },
    }),
    patch: protectedOperation({
      tags: ['Branches'],
      summary: 'Update branch',
      description: 'Requires Owner or Manager role.',
      parameters: [uuidPathParam('branchId', 'Branch identifier')],
      requestBody: jsonRequestBody('UpdateBranchRequest'),
      responses: {
        ...successResponse('Branch', 'Updated branch'),
      },
    }),
  },
  '/api/v1/branches/{branchId}/archive': {
    post: protectedOperation({
      tags: ['Branches'],
      summary: 'Archive branch',
      description:
        'Soft-deletes the branch and sets status to INACTIVE. Requires Owner or Manager role.',
      parameters: [uuidPathParam('branchId', 'Branch identifier')],
      responses: {
        ...successResponse('Branch', 'Archived branch'),
      },
    }),
  },
};
