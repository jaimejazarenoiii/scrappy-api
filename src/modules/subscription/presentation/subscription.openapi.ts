export const subscriptionOpenApiPaths = {
  '/admin/companies/{companyId}/subscriptions': {
    get: {
      tags: ['Admin Subscriptions'],
      summary: 'List subscription history',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'companyId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 100 } },
        {
          in: 'query',
          name: 'sortOrder',
          schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
      ],
      responses: {
        '200': { description: 'Paginated subscription history' },
        '401': { $ref: '#/components/responses/Unauthenticated' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
    post: {
      tags: ['Admin Subscriptions'],
      summary: 'Create subscription period',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'companyId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateSubscriptionRequest' },
          },
        },
      },
      responses: {
        '201': { description: 'Created subscription' },
        '400': { $ref: '#/components/responses/ValidationError' },
        '401': { $ref: '#/components/responses/Unauthenticated' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
  },
  '/admin/companies/{companyId}/subscriptions/renew': {
    post: {
      tags: ['Admin Subscriptions'],
      summary: 'Renew subscription',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'companyId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/RenewSubscriptionRequest' } },
        },
      },
      responses: {
        '201': { description: 'Renewed subscription' },
        '400': { $ref: '#/components/responses/ValidationError' },
        '403': { $ref: '#/components/responses/Forbidden' },
      },
    },
  },
  '/admin/companies/{companyId}/subscriptions/expire': {
    post: {
      tags: ['Admin Subscriptions'],
      summary: 'Expire company subscription',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'companyId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': { description: 'Company subscription expired' },
        '403': { $ref: '#/components/responses/Forbidden' },
      },
    },
  },
  '/admin/companies/{companyId}/subscriptions/suspend': {
    post: {
      tags: ['Admin Subscriptions'],
      summary: 'Suspend company subscription',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'companyId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': { description: 'Company subscription suspended' },
        '403': { $ref: '#/components/responses/Forbidden' },
      },
    },
  },
  '/admin/companies/{companyId}/subscriptions/{subscriptionId}': {
    get: {
      tags: ['Admin Subscriptions'],
      summary: 'Get subscription by id',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'companyId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
        {
          in: 'path',
          name: 'subscriptionId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': { description: 'Subscription detail' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
    patch: {
      tags: ['Admin Subscriptions'],
      summary: 'Update subscription period',
      description:
        'Edit an existing subscription period (dates, plan, notes, period status). Overlap and single-ACTIVE rules still apply.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'companyId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
        {
          in: 'path',
          name: 'subscriptionId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              minProperties: 1,
              properties: {
                planName: { type: 'string' },
                startsAt: { type: 'string', format: 'date-time' },
                endsAt: { type: 'string', format: 'date-time' },
                status: {
                  type: 'string',
                  enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED'],
                },
                companyStatus: {
                  type: 'string',
                  enum: ['TRIAL', 'ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'SUSPENDED'],
                },
                notes: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Subscription updated' },
        '400': { $ref: '#/components/responses/ValidationError' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '404': { $ref: '#/components/responses/NotFound' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/admin/companies/{companyId}/subscription-status': {
    get: {
      tags: ['Admin Subscriptions'],
      summary: 'Get company subscription status (admin)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'companyId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Current subscription status',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SubscriptionStatusResponse' },
            },
          },
        },
        '403': { $ref: '#/components/responses/Forbidden' },
      },
    },
  },
  '/companies/me/subscription-status': {
    get: {
      tags: ['Company Subscription Status'],
      summary: 'Get my company subscription status',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Read-only subscription status for authenticated tenant',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SubscriptionStatusResponse' },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthenticated' },
      },
    },
  },
};
