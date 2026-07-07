import {
  jsonRequestBody,
  paginatedListResponse,
  protectedOperation,
  queryParam,
  successResponse,
  uuidPathParam,
} from '../../../swagger/openapi-helpers.js';

export const vehicleOpenApiPaths = {
  '/api/v1/vehicles': {
    get: protectedOperation({
      tags: ['Vehicles'],
      summary: 'List operational vehicles',
      description:
        'Returns paginated active vehicles for the authenticated company. Archived vehicles are excluded.',
      parameters: [
        queryParam('page', { type: 'integer', minimum: 1, default: 1 }, 'Page number'),
        queryParam(
          'limit',
          { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          'Page size',
        ),
        queryParam('sortOrder', { type: 'string', enum: ['asc', 'desc'], default: 'asc' }),
        queryParam('search', { type: 'string' }, 'Search plate number or description'),
        queryParam(
          'sortBy',
          { type: 'string', enum: ['plateNumber', 'createdAt', 'status'] },
          'Sort field',
        ),
        queryParam(
          'status',
          { type: 'string', enum: ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'INACTIVE'] },
          'Filter by status',
        ),
      ],
      responses: {
        ...paginatedListResponse('Vehicle', 'Vehicle list'),
      },
    }),
    post: protectedOperation({
      tags: ['Vehicles'],
      summary: 'Create vehicle',
      description: 'Requires Owner or Manager role.',
      requestBody: jsonRequestBody('CreateVehicleRequest'),
      responses: {
        ...successResponse('Vehicle', 'Vehicle created', '201'),
      },
    }),
  },
  '/api/v1/vehicles/{vehicleId}': {
    get: protectedOperation({
      tags: ['Vehicles'],
      summary: 'Get vehicle by ID',
      parameters: [uuidPathParam('vehicleId', 'Vehicle identifier')],
      responses: {
        ...successResponse('Vehicle', 'Vehicle details'),
      },
    }),
    patch: protectedOperation({
      tags: ['Vehicles'],
      summary: 'Update vehicle',
      description: 'Requires Owner or Manager role.',
      parameters: [uuidPathParam('vehicleId', 'Vehicle identifier')],
      requestBody: jsonRequestBody('UpdateVehicleRequest'),
      responses: {
        ...successResponse('Vehicle', 'Updated vehicle'),
      },
    }),
  },
  '/api/v1/vehicles/{vehicleId}/archive': {
    post: protectedOperation({
      tags: ['Vehicles'],
      summary: 'Archive vehicle',
      parameters: [uuidPathParam('vehicleId', 'Vehicle identifier')],
      responses: {
        ...successResponse('Vehicle', 'Archived vehicle'),
      },
    }),
  },
};
