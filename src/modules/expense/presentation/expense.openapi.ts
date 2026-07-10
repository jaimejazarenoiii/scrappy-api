import {
  protectedOperation,
  successResponse,
  uuidPathParam,
} from '../../../swagger/openapi-helpers.js';

const EXPENSES_TAG = 'Expenses';
const EXPENSE_STATUS_TAG = 'Expense Status';
const EXPENSE_ATTACHMENTS_TAG = 'Expense Attachments';

export const expenseOpenApiPaths = {
  '/api/v1/expenses': {
    get: {
      tags: ['Expenses'],
      summary: 'List company expenses (Manager/Owner)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        {
          name: 'sortBy',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['expenseDate', 'createdAt', 'expenseNumber', 'amount'],
            default: 'expenseDate',
          },
        },
        {
          name: 'sortOrder',
          in: 'query',
          schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
      ],
      responses: {
        '200': {
          description: 'Paginated expense summaries',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/ExpenseSummary' },
                  },
                  meta: { $ref: '#/components/schemas/PaginationMeta' },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Expenses'],
      summary: 'Create expense',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateExpenseRequest' },
          },
        },
      },
      responses: {
        '201': {
          description: 'Expense created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/ExpenseDetail' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/v1/expenses/mine': {
    get: {
      tags: ['Expenses'],
      summary: 'List own expenses',
      security: [{ bearerAuth: [] }],
      responses: { '200': { description: 'Paginated own expense summaries' } },
    },
  },
  '/api/v1/expenses/categories': {
    get: protectedOperation({
      tags: [EXPENSES_TAG],
      summary: 'List expense category suggestions',
      description:
        'Returns the company ExpenseCategory catalog (seeded defaults plus any custom values ' +
        'already used on expenses). Falls back to built-in defaults when the catalog is empty.',
      responses: {
        ...successResponse('ExpenseCategoryList', 'Expense category names'),
      },
    }),
  },
  '/api/v1/expenses/by-number/{expenseNumber}': {
    get: {
      tags: ['Expenses'],
      summary: 'Get expense by number',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'expenseNumber',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/ExpenseNumber' },
        },
      ],
      responses: { '200': { description: 'Expense detail' } },
    },
  },
  '/api/v1/expenses/{expenseId}': {
    get: {
      tags: ['Expenses'],
      summary: 'Get expense detail',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'expenseId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: { '200': { description: 'Expense detail' } },
    },
    patch: {
      tags: ['Expenses'],
      summary: 'Update expense',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'expenseId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateExpenseRequest' },
          },
        },
      },
      responses: { '200': { description: 'Updated expense' } },
    },
  },
  '/api/v1/expenses/{expenseId}/record': {
    post: {
      tags: [EXPENSE_STATUS_TAG],
      summary: 'Record expense',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'expenseId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: { '200': { description: 'Recorded expense' } },
    },
  },
  '/api/v1/expenses/{expenseId}/cancel': {
    post: {
      tags: [EXPENSE_STATUS_TAG],
      summary: 'Cancel expense',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'expenseId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CancelExpenseRequest' },
          },
        },
      },
      responses: { '200': { description: 'Cancelled expense' } },
    },
  },
  '/api/v1/expenses/{expenseId}/archive': {
    post: {
      tags: [EXPENSES_TAG],
      summary: 'Archive expense',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'expenseId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: { '200': { description: 'Archived expense' } },
    },
  },
  '/api/v1/expenses/{expenseId}/attachments': {
    get: protectedOperation({
      tags: [EXPENSE_ATTACHMENTS_TAG],
      summary: 'List expense attachments',
      parameters: [uuidPathParam('expenseId', 'Expense identifier')],
      responses: {
        ...successResponse(
          { type: 'array', items: 'ExpenseAttachment' },
          'Expense attachment metadata',
        ),
      },
    }),
    post: protectedOperation({
      tags: [EXPENSE_ATTACHMENTS_TAG],
      summary: 'Upload expense receipt photo',
      parameters: [uuidPathParam('expenseId', 'Expense identifier')],
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
      responses: {
        ...successResponse('ExpenseAttachment', 'Attachment uploaded', '201'),
      },
    }),
  },
  '/api/v1/expenses/{expenseId}/attachments/{attachmentId}': {
    delete: protectedOperation({
      tags: [EXPENSE_ATTACHMENTS_TAG],
      summary: 'Remove an expense attachment',
      parameters: [
        uuidPathParam('expenseId', 'Expense identifier'),
        uuidPathParam('attachmentId', 'Attachment identifier'),
      ],
      responses: {
        '204': { description: 'Attachment removed' },
      },
    }),
  },
  '/api/v1/expenses/{expenseId}/attachments/{attachmentId}/content': {
    get: protectedOperation({
      tags: [EXPENSE_ATTACHMENTS_TAG],
      summary: 'Download expense attachment',
      parameters: [
        uuidPathParam('expenseId', 'Expense identifier'),
        uuidPathParam('attachmentId', 'Attachment identifier'),
        {
          name: 'access_token',
          in: 'query',
          required: false,
          schema: { type: 'string' },
          description:
            'JWT access token for browser image requests that cannot send Authorization headers',
        },
      ],
      responses: {
        '200': {
          description: 'Attachment binary content',
          content: {
            'image/jpeg': { schema: { type: 'string', format: 'binary' } },
            'image/png': { schema: { type: 'string', format: 'binary' } },
            'image/webp': { schema: { type: 'string', format: 'binary' } },
          },
        },
      },
    }),
  },
};
