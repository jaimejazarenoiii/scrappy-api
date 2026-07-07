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

export const warehouseOpenApiPaths = {
  '/api/v1/warehouses': {
    get: protectedOperation({
      tags: ['Warehouses'],
      summary: 'List operational warehouses',
      description:
        'Returns paginated active warehouses for the authenticated company. Archived warehouses are excluded.',
      parameters: [
        queryParam('page', { type: 'integer', minimum: 1, default: 1 }, 'Page number'),
        queryParam(
          'limit',
          { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          'Page size',
        ),
        queryParam('sortOrder', { type: 'string', enum: ['asc', 'desc'], default: 'asc' }),
        queryParam('search', { type: 'string' }, 'Search name, address, or contact number'),
        ...locationListParams,
      ],
      responses: {
        ...paginatedListResponse('Warehouse', 'Warehouse list'),
      },
    }),
    post: protectedOperation({
      tags: ['Warehouses'],
      summary: 'Create warehouse',
      description: 'Requires Owner or Manager role.',
      requestBody: jsonRequestBody('CreateWarehouseRequest'),
      responses: {
        ...successResponse('Warehouse', 'Warehouse created', '201'),
      },
    }),
  },
  '/api/v1/warehouses/{warehouseId}': {
    get: protectedOperation({
      tags: ['Warehouses'],
      summary: 'Get warehouse by ID',
      parameters: [uuidPathParam('warehouseId', 'Warehouse identifier')],
      responses: {
        ...successResponse('Warehouse', 'Warehouse details'),
      },
    }),
    patch: protectedOperation({
      tags: ['Warehouses'],
      summary: 'Update warehouse',
      description: 'Requires Owner or Manager role.',
      parameters: [uuidPathParam('warehouseId', 'Warehouse identifier')],
      requestBody: jsonRequestBody('UpdateWarehouseRequest'),
      responses: {
        ...successResponse('Warehouse', 'Updated warehouse'),
      },
    }),
  },
  '/api/v1/warehouses/{warehouseId}/archive': {
    post: protectedOperation({
      tags: ['Warehouses'],
      summary: 'Archive warehouse',
      parameters: [uuidPathParam('warehouseId', 'Warehouse identifier')],
      responses: {
        ...successResponse('Warehouse', 'Archived warehouse'),
      },
    }),
  },
};
