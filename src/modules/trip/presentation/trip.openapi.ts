import {
  jsonRequestBody,
  paginatedListResponse,
  protectedOperation,
  queryParam,
  successResponse,
  uuidPathParam,
} from '../../../swagger/openapi-helpers.js';

const TRIPS_TAG = 'Trips';
const TRIP_STATUS_TAG = 'Trip Status';
const TRIP_MEMBERS_TAG = 'Trip Members';

const listQueryParams = [
  queryParam('page', { type: 'integer', default: 1 }),
  queryParam('limit', { type: 'integer', default: 20 }),
  queryParam('sortBy', { type: 'string', enum: ['scheduledStart', 'createdAt', 'tripNumber'] }),
  queryParam('sortOrder', { type: 'string', enum: ['asc', 'desc'] }),
  queryParam('status', { type: 'string', enum: ['DRAFT', 'STARTED', 'COMPLETED', 'CANCELLED'] }),
  queryParam('vehicleId', { type: 'string', format: 'uuid' }),
  queryParam('employeeId', { type: 'string', format: 'uuid' }),
  queryParam('fromDate', { type: 'string', format: 'date' }),
  queryParam('toDate', { type: 'string', format: 'date' }),
  queryParam('tripNumber', { type: 'string' }),
  queryParam('includeArchived', { type: 'boolean', default: false }),
];

export const tripOpenApiPaths = {
  '/api/v1/trips': {
    post: protectedOperation({
      tags: [TRIPS_TAG],
      summary: 'Create Draft trip',
      requestBody: jsonRequestBody('CreateTripRequest'),
      responses: { ...successResponse('TripDetail', 'Trip created with Trip Number', '201') },
    }),
    get: protectedOperation({
      tags: [TRIPS_TAG],
      summary: 'List company trips (Manager/Owner)',
      parameters: listQueryParams,
      responses: { ...paginatedListResponse('TripSummary', 'Paginated trip summaries') },
    }),
  },
  '/api/v1/trips/mine': {
    get: protectedOperation({
      tags: [TRIPS_TAG],
      summary: 'List trips assigned to authenticated Employee',
      parameters: [
        queryParam('page', { type: 'integer', default: 1 }),
        queryParam('limit', { type: 'integer', default: 20 }),
        queryParam('status', {
          type: 'string',
          enum: ['DRAFT', 'STARTED', 'COMPLETED', 'CANCELLED'],
        }),
      ],
      responses: { ...paginatedListResponse('TripSummary', 'Paginated assigned trips') },
    }),
  },
  '/api/v1/trips/by-number/{tripNumber}': {
    get: protectedOperation({
      tags: [TRIPS_TAG],
      summary: 'Get trip by Trip Number',
      parameters: [
        {
          in: 'path',
          name: 'tripNumber',
          required: true,
          description: 'Business trip number',
          schema: { type: 'string', pattern: '^TRIP-\\d{8}-\\d{6}$' },
        },
      ],
      responses: { ...successResponse('TripDetail', 'Trip detail') },
    }),
  },
  '/api/v1/trips/{tripId}': {
    get: protectedOperation({
      tags: [TRIPS_TAG],
      summary: 'Get trip detail',
      parameters: [uuidPathParam('tripId', 'Trip identifier')],
      responses: { ...successResponse('TripDetail', 'Trip detail with members') },
    }),
    patch: protectedOperation({
      tags: [TRIPS_TAG],
      summary: 'Update Draft trip header',
      parameters: [uuidPathParam('tripId', 'Trip identifier')],
      requestBody: jsonRequestBody('UpdateTripRequest'),
      responses: { ...successResponse('TripDetail', 'Updated trip') },
    }),
  },
  '/api/v1/trips/{tripId}/archive': {
    post: protectedOperation({
      tags: [TRIPS_TAG],
      summary: 'Archive Completed or Cancelled trip',
      parameters: [uuidPathParam('tripId', 'Trip identifier')],
      requestBody: jsonRequestBody('ArchiveTripRequest', false),
      responses: { ...successResponse('TripDetail', 'Archived trip') },
    }),
  },
  '/api/v1/trips/{tripId}/start': {
    post: protectedOperation({
      tags: [TRIP_STATUS_TAG],
      summary: 'Start Draft trip',
      parameters: [uuidPathParam('tripId', 'Trip identifier')],
      requestBody: jsonRequestBody('StartTripRequest', false),
      responses: { ...successResponse('TripDetail', 'Trip started') },
    }),
  },
  '/api/v1/trips/{tripId}/complete': {
    post: protectedOperation({
      tags: [TRIP_STATUS_TAG],
      summary: 'Complete Started trip',
      parameters: [uuidPathParam('tripId', 'Trip identifier')],
      requestBody: jsonRequestBody('CompleteTripRequest', false),
      responses: { ...successResponse('TripDetail', 'Trip completed') },
    }),
  },
  '/api/v1/trips/{tripId}/cancel': {
    post: protectedOperation({
      tags: [TRIP_STATUS_TAG],
      summary: 'Cancel Draft trip',
      parameters: [uuidPathParam('tripId', 'Trip identifier')],
      requestBody: jsonRequestBody('CancelTripRequest'),
      responses: { ...successResponse('TripDetail', 'Trip cancelled') },
    }),
  },
  '/api/v1/trips/{tripId}/members': {
    post: protectedOperation({
      tags: [TRIP_MEMBERS_TAG],
      summary: 'Add member to Draft trip',
      parameters: [uuidPathParam('tripId', 'Trip identifier')],
      requestBody: jsonRequestBody('AddTripMemberRequest'),
      responses: { ...successResponse('TripMember', 'Member added', '201') },
    }),
  },
  '/api/v1/trips/{tripId}/members/{memberId}': {
    patch: protectedOperation({
      tags: [TRIP_MEMBERS_TAG],
      summary: 'Update member role on Draft trip',
      parameters: [
        uuidPathParam('tripId', 'Trip identifier'),
        uuidPathParam('memberId', 'Trip member identifier'),
      ],
      requestBody: jsonRequestBody('UpdateTripMemberRequest'),
      responses: { ...successResponse('TripMember', 'Member updated') },
    }),
    delete: protectedOperation({
      tags: [TRIP_MEMBERS_TAG],
      summary: 'Remove member from Draft trip',
      parameters: [
        uuidPathParam('tripId', 'Trip identifier'),
        uuidPathParam('memberId', 'Trip member identifier'),
      ],
      responses: { ...successResponse('DeletionResult', 'Member removed') },
    }),
  },
};
