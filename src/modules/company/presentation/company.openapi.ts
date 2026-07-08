import {
  jsonRequestBody,
  protectedOperation,
  successResponse,
  uuidPathParam,
} from '../../../swagger/openapi-helpers.js';

export const companyOpenApiPaths = {
  '/api/v1/companies': {
    post: protectedOperation(
      {
        tags: ['Company'],
        summary: 'Create company and initial owner',
        description: 'Public onboarding endpoint. Creates a Company and its first Owner user.',
        requestBody: jsonRequestBody('CreateCompanyRequest'),
        responses: {
          '201': {
            description: 'Company and owner created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', enum: [true] },
                    data: {
                      type: 'object',
                      properties: {
                        company: { $ref: '#/components/schemas/Company' },
                        owner: { $ref: '#/components/schemas/AuthUser' },
                      },
                    },
                    meta: { type: 'object' },
                    error: { nullable: true, type: 'null' },
                  },
                },
              },
            },
          },
        },
      },
      { requireAuth: false },
    ),
  },
  '/api/v1/companies/me': {
    get: protectedOperation({
      tags: ['Company'],
      summary: 'View current company',
      description:
        "Returns the authenticated user's own company, resolved from the access token. No identifier required.",
      responses: {
        ...successResponse('Company', 'Current company details'),
      },
    }),
  },
  '/api/v1/companies/{companyId}': {
    get: protectedOperation({
      tags: ['Company'],
      summary: 'View company',
      parameters: [uuidPathParam('companyId', 'Company identifier')],
      responses: {
        ...successResponse('Company', 'Company details'),
      },
    }),
    patch: protectedOperation({
      tags: ['Company'],
      summary: 'Update company',
      description: 'Requires Owner role.',
      parameters: [uuidPathParam('companyId', 'Company identifier')],
      requestBody: jsonRequestBody('UpdateCompanyRequest'),
      responses: {
        ...successResponse('Company', 'Updated company'),
      },
    }),
  },
  '/api/v1/companies/{companyId}/archive': {
    post: protectedOperation({
      tags: ['Company'],
      summary: 'Archive company',
      description: 'Requires Owner role.',
      parameters: [uuidPathParam('companyId', 'Company identifier')],
      responses: {
        ...successResponse('Company', 'Archived company'),
      },
    }),
  },
};
