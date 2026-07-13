export const adminCompanyOpenApiPaths = {
  '/api/v1/admin/companies': {
    post: {
      tags: ['Admin'],
      summary: 'Create company (SUPER_ADMIN)',
      description:
        'Creates a company without an owner. Add accounts via POST /admin/companies/{companyId}/accounts.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string' },
                logoUrl: { type: 'string', format: 'uri' },
                contactNumber: { type: 'string' },
                email: { type: 'string', format: 'email' },
                address: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Company created' },
        '400': { $ref: '#/components/responses/ValidationError' },
        '401': { $ref: '#/components/responses/Unauthenticated' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
    get: {
      tags: ['Admin'],
      summary: 'List companies (SUPER_ADMIN)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 100 } },
        {
          in: 'query',
          name: 'sortOrder',
          schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        },
        { in: 'query', name: 'search', schema: { type: 'string' } },
      ],
      responses: {
        '200': { description: 'Paginated company list' },
        '401': { $ref: '#/components/responses/Unauthenticated' },
        '403': { $ref: '#/components/responses/Forbidden' },
      },
    },
  },
  '/api/v1/admin/companies/{companyId}': {
    get: {
      tags: ['Admin'],
      summary: 'Get company (SUPER_ADMIN)',
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
        '200': { description: 'Company detail' },
        '401': { $ref: '#/components/responses/Unauthenticated' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
  },
  '/api/v1/admin/companies/{companyId}/accounts': {
    post: {
      tags: ['Admin'],
      summary: 'Create company account (SUPER_ADMIN)',
      description: 'Creates Employee + User (OWNER | MANAGER | EMPLOYEE) for an existing company.',
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
            schema: {
              type: 'object',
              required: ['firstName', 'lastName', 'weeklySalary', 'account'],
              properties: {
                firstName: { type: 'string' },
                middleName: { type: 'string' },
                lastName: { type: 'string' },
                suffix: { type: 'string' },
                employeeNumber: { type: 'string' },
                contactNumber: { type: 'string' },
                weeklySalary: { type: 'number', minimum: 0 },
                status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
                account: {
                  type: 'object',
                  required: ['email', 'password', 'confirmPassword', 'role'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    confirmPassword: { type: 'string', minLength: 8 },
                    role: { type: 'string', enum: ['OWNER', 'MANAGER', 'EMPLOYEE'] },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Employee + User created' },
        '400': { $ref: '#/components/responses/ValidationError' },
        '401': { $ref: '#/components/responses/Unauthenticated' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '404': { $ref: '#/components/responses/NotFound' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
};
