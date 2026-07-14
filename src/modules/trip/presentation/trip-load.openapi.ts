import {
  jsonRequestBody,
  protectedOperation,
  successResponse,
  uuidPathParam,
} from '../../../swagger/openapi-helpers.js';

const TRIP_LOAD_TAG = 'Trip Load';
const SETTINGS_TAG = 'Company Trip Load Settings';

export const tripLoadOpenApiPaths = {
  '/api/v1/companies/me/trip-load-settings': {
    get: protectedOperation({
      tags: [SETTINGS_TAG],
      summary: 'Get company Trip Load defaults',
      responses: { ...successResponse('TripLoadSettings', 'Company Trip Load defaults') },
    }),
    patch: protectedOperation({
      tags: [SETTINGS_TAG],
      summary: 'Update company Trip Load defaults',
      requestBody: jsonRequestBody('TripLoadSettings'),
      responses: { ...successResponse('TripLoadSettings', 'Updated defaults') },
    }),
  },
  '/api/v1/trips/{tripId}/load': {
    post: protectedOperation({
      tags: [TRIP_LOAD_TAG],
      summary: 'Create Trip Load with items (Draft)',
      parameters: [uuidPathParam('tripId', 'Trip identifier')],
      requestBody: jsonRequestBody('CreateTripLoadRequest'),
      responses: { ...successResponse('TripLoad', 'Trip load created', '201') },
    }),
    get: protectedOperation({
      tags: [TRIP_LOAD_TAG],
      summary: 'Get Trip Load',
      parameters: [uuidPathParam('tripId', 'Trip identifier')],
      responses: { ...successResponse('TripLoad', 'Trip load detail') },
    }),
    patch: protectedOperation({
      tags: [TRIP_LOAD_TAG],
      summary: 'Update Trip Load notes (Draft)',
      parameters: [uuidPathParam('tripId', 'Trip identifier')],
      requestBody: jsonRequestBody('UpdateTripLoadRequest'),
      responses: { ...successResponse('TripLoad', 'Trip load updated') },
    }),
    delete: protectedOperation({
      tags: [TRIP_LOAD_TAG],
      summary: 'Delete Trip Load (Draft)',
      parameters: [uuidPathParam('tripId', 'Trip identifier')],
      responses: { ...successResponse('TripLoadFlags', 'Trip load deleted') },
    }),
  },
  '/api/v1/trips/{tripId}/load/enable': {
    post: protectedOperation({
      tags: [TRIP_LOAD_TAG],
      summary: 'Enable Trip Load on Draft trip',
      parameters: [uuidPathParam('tripId', 'Trip identifier')],
      requestBody: jsonRequestBody('EnableTripLoadRequest', false),
      responses: { ...successResponse('TripLoadFlags', 'Trip load enabled') },
    }),
  },
  '/api/v1/trips/{tripId}/load/disable': {
    post: protectedOperation({
      tags: [TRIP_LOAD_TAG],
      summary: 'Disable Trip Load on Draft trip (clears load)',
      parameters: [uuidPathParam('tripId', 'Trip identifier')],
      responses: { ...successResponse('TripLoadFlags', 'Trip load disabled') },
    }),
  },
  '/api/v1/trips/{tripId}/load/summary': {
    get: protectedOperation({
      tags: [TRIP_LOAD_TAG],
      summary: 'Trip Load summary with remaining quantities',
      parameters: [uuidPathParam('tripId', 'Trip identifier')],
      responses: { ...successResponse('TripLoadSummary', 'Trip load summary') },
    }),
  },
  '/api/v1/trips/{tripId}/load/items': {
    post: protectedOperation({
      tags: [TRIP_LOAD_TAG],
      summary: 'Add Trip Load item (Draft)',
      parameters: [uuidPathParam('tripId', 'Trip identifier')],
      requestBody: jsonRequestBody('CreateTripLoadItemRequest'),
      responses: { ...successResponse('TripLoadItem', 'Trip load item added', '201') },
    }),
  },
  '/api/v1/trips/{tripId}/load/items/{itemId}': {
    patch: protectedOperation({
      tags: [TRIP_LOAD_TAG],
      summary: 'Update Trip Load item (Draft)',
      parameters: [
        uuidPathParam('tripId', 'Trip identifier'),
        uuidPathParam('itemId', 'Trip load item identifier'),
      ],
      requestBody: jsonRequestBody('UpdateTripLoadItemRequest'),
      responses: { ...successResponse('TripLoadItem', 'Trip load item updated') },
    }),
    delete: protectedOperation({
      tags: [TRIP_LOAD_TAG],
      summary: 'Remove Trip Load item (Draft)',
      parameters: [
        uuidPathParam('tripId', 'Trip identifier'),
        uuidPathParam('itemId', 'Trip load item identifier'),
      ],
      responses: { ...successResponse('DeletionResult', 'Trip load item removed') },
    }),
  },
};
