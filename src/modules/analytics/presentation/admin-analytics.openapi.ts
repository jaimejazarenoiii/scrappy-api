const companyIdParam = {
  in: 'path' as const,
  name: 'companyId',
  required: true,
  schema: { type: 'string', format: 'uuid' },
};

function adminAnalyticsGet(summary: string) {
  return {
    get: {
      tags: ['Admin'],
      summary,
      security: [{ bearerAuth: [] }],
      parameters: [companyIdParam],
      responses: {
        '200': { description: summary },
        '401': { $ref: '#/components/responses/Unauthenticated' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
  };
}

export const adminAnalyticsOpenApiPaths = {
  '/api/v1/admin/analytics/overview': {
    get: {
      tags: ['Admin'],
      summary: 'Portfolio analytics overview (SUPER_ADMIN)',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': { description: 'Portfolio metrics for all companies' },
        '401': { $ref: '#/components/responses/Unauthenticated' },
        '403': { $ref: '#/components/responses/Forbidden' },
      },
    },
  },
  '/api/v1/admin/analytics/companies/{companyId}/company':
    adminAnalyticsGet('Admin company analytics'),
  '/api/v1/admin/analytics/companies/{companyId}/transactions': adminAnalyticsGet(
    'Admin transaction analytics',
  ),
  '/api/v1/admin/analytics/companies/{companyId}/trips': adminAnalyticsGet('Admin trip analytics'),
  '/api/v1/admin/analytics/companies/{companyId}/expenses':
    adminAnalyticsGet('Admin expense analytics'),
  '/api/v1/admin/analytics/companies/{companyId}/workforce': adminAnalyticsGet(
    'Admin workforce analytics',
  ),
  '/api/v1/admin/analytics/companies/{companyId}/organization': adminAnalyticsGet(
    'Admin organization analytics',
  ),
};
