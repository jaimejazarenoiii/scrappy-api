import {
  jsonRequestBody,
  paginatedListResponse,
  protectedOperation,
  queryParam,
  successResponse,
  uuidPathParam,
} from '../../../swagger/openapi-helpers.js';

const TRANSACTIONS_TAG = 'Transactions';
const ITEMS_TAG = 'Transaction Items';
const ATTACHMENTS_TAG = 'Transaction Attachments';
const SUGGESTIONS_TAG = 'Transaction Suggestions';

const listQueryParams = [
  queryParam('page', { type: 'integer', default: 1 }),
  queryParam('limit', { type: 'integer', default: 20 }),
  queryParam('sortBy', { type: 'string', enum: ['transactionDate', 'createdAt', 'status'] }),
  queryParam('sortOrder', { type: 'string', enum: ['asc', 'desc'] }),
  queryParam('search', { type: 'string' }),
  queryParam('direction', { type: 'string', enum: ['INBOUND', 'OUTBOUND'] }),
  queryParam('status', { type: 'string', enum: ['DRAFT', 'CANCELLED'] }),
  queryParam('locationType', { type: 'string', enum: ['BRANCH', 'WAREHOUSE', 'OUTSIDE'] }),
  queryParam('branchId', { type: 'string', format: 'uuid' }),
  queryParam('warehouseId', { type: 'string', format: 'uuid' }),
  queryParam('fromDate', { type: 'string', format: 'date-time' }),
  queryParam('toDate', { type: 'string', format: 'date-time' }),
  queryParam('includeArchived', { type: 'string', enum: ['true', 'false'] }),
];

export const transactionOpenApiPaths = {
  '/api/v1/transactions': {
    post: protectedOperation({
      tags: [TRANSACTIONS_TAG],
      summary: 'Create a draft transaction',
      requestBody: jsonRequestBody('CreateTransactionRequest'),
      responses: { ...successResponse('TransactionDetail', 'Transaction created', '201') },
    }),
    get: protectedOperation({
      tags: [TRANSACTIONS_TAG],
      summary: 'List company transactions (owners/managers)',
      parameters: listQueryParams,
      responses: { ...paginatedListResponse('TransactionSummary', 'Company transactions') },
    }),
  },
  '/api/v1/transactions/assigned': {
    get: protectedOperation({
      tags: [TRANSACTIONS_TAG],
      summary: 'List transactions assigned to the acting employee',
      parameters: listQueryParams,
      responses: { ...paginatedListResponse('TransactionSummary', 'Assigned transactions') },
    }),
  },
  '/api/v1/transactions/suggestions/materials': {
    get: protectedOperation({
      tags: [SUGGESTIONS_TAG],
      summary: 'Material name suggestions from company history',
      parameters: [
        queryParam('q', { type: 'string' }, 'Prefix or substring filter'),
        queryParam('limit', { type: 'integer', default: 10 }),
      ],
      responses: {
        ...successResponse({ type: 'array', items: 'MaterialSuggestion' }, 'Material suggestions'),
      },
    }),
  },
  '/api/v1/transactions/suggestions/prices': {
    get: protectedOperation({
      tags: [SUGGESTIONS_TAG],
      summary: 'Price suggestions for a material from company history',
      parameters: [
        queryParam('materialName', { type: 'string' }, 'Material to suggest prices for', true),
        queryParam('limit', { type: 'integer', default: 10 }),
      ],
      responses: {
        ...successResponse({ type: 'array', items: 'PriceSuggestion' }, 'Price suggestions'),
      },
    }),
  },
  '/api/v1/transactions/{transactionId}': {
    get: protectedOperation({
      tags: [TRANSACTIONS_TAG],
      summary: 'Get a transaction with items, attachments, and assignments',
      parameters: [uuidPathParam('transactionId', 'Transaction identifier')],
      responses: { ...successResponse('TransactionDetail', 'Transaction detail') },
    }),
    patch: protectedOperation({
      tags: [TRANSACTIONS_TAG],
      summary: 'Update a draft transaction (supports auto-save)',
      parameters: [uuidPathParam('transactionId', 'Transaction identifier')],
      requestBody: jsonRequestBody('UpdateTransactionRequest'),
      responses: { ...successResponse('TransactionDetail', 'Updated transaction') },
    }),
  },
  '/api/v1/transactions/{transactionId}/cancel': {
    post: protectedOperation({
      tags: [TRANSACTIONS_TAG],
      summary: 'Cancel a draft transaction (becomes read-only)',
      parameters: [uuidPathParam('transactionId', 'Transaction identifier')],
      requestBody: jsonRequestBody('CancelTransactionRequest', false),
      responses: { ...successResponse('TransactionDetail', 'Cancelled transaction') },
    }),
  },
  '/api/v1/transactions/{transactionId}/archive': {
    post: protectedOperation({
      tags: [TRANSACTIONS_TAG],
      summary: 'Archive a transaction (owners/managers)',
      parameters: [uuidPathParam('transactionId', 'Transaction identifier')],
      responses: { ...successResponse('TransactionDetail', 'Archived transaction') },
    }),
  },
  '/api/v1/transactions/{transactionId}/items': {
    get: protectedOperation({
      tags: [ITEMS_TAG],
      summary: 'List transaction items',
      parameters: [uuidPathParam('transactionId', 'Transaction identifier')],
      responses: {
        ...successResponse({ type: 'array', items: 'TransactionItem' }, 'Transaction items'),
      },
    }),
    post: protectedOperation({
      tags: [ITEMS_TAG],
      summary: 'Add an item to a draft transaction',
      parameters: [uuidPathParam('transactionId', 'Transaction identifier')],
      requestBody: jsonRequestBody('CreateTransactionItemRequest'),
      responses: { ...successResponse('TransactionItem', 'Item added', '201') },
    }),
  },
  '/api/v1/transactions/{transactionId}/items/{itemId}': {
    patch: protectedOperation({
      tags: [ITEMS_TAG],
      summary: 'Update a transaction item',
      parameters: [
        uuidPathParam('transactionId', 'Transaction identifier'),
        uuidPathParam('itemId', 'Item identifier'),
      ],
      requestBody: jsonRequestBody('UpdateTransactionItemRequest'),
      responses: { ...successResponse('TransactionItem', 'Item updated') },
    }),
    delete: protectedOperation({
      tags: [ITEMS_TAG],
      summary: 'Remove a transaction item',
      parameters: [
        uuidPathParam('transactionId', 'Transaction identifier'),
        uuidPathParam('itemId', 'Item identifier'),
      ],
      responses: { ...successResponse('DeletionResult', 'Item removed') },
    }),
  },
  '/api/v1/transactions/{transactionId}/attachments': {
    get: protectedOperation({
      tags: [ATTACHMENTS_TAG],
      summary: 'List transaction photo attachments',
      parameters: [uuidPathParam('transactionId', 'Transaction identifier')],
      responses: {
        ...successResponse(
          { type: 'array', items: 'TransactionAttachment' },
          'Transaction attachments',
        ),
      },
    }),
    post: protectedOperation({
      tags: [ATTACHMENTS_TAG],
      summary: 'Upload a photo to a draft transaction',
      parameters: [uuidPathParam('transactionId', 'Transaction identifier')],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file'],
              properties: { file: { type: 'string', format: 'binary' } },
            },
          },
        },
      },
      responses: { ...successResponse('TransactionAttachment', 'Attachment uploaded', '201') },
    }),
  },
  '/api/v1/transactions/{transactionId}/attachments/{attachmentId}': {
    delete: protectedOperation({
      tags: [ATTACHMENTS_TAG],
      summary: 'Remove a transaction attachment',
      parameters: [
        uuidPathParam('transactionId', 'Transaction identifier'),
        uuidPathParam('attachmentId', 'Attachment identifier'),
      ],
      responses: { ...successResponse('DeletionResult', 'Attachment removed') },
    }),
  },
};
