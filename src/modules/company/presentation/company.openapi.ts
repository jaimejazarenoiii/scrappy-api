export const companyOpenApiPaths = {
  '/api/v1/companies': { post: { tags: ['Company'], summary: 'Create company and initial owner' } },
  '/api/v1/companies/{companyId}': {
    get: { tags: ['Company'], summary: 'View company' },
    patch: { tags: ['Company'], summary: 'Update company' },
  },
  '/api/v1/companies/{companyId}/archive': {
    post: { tags: ['Company'], summary: 'Archive company' },
  },
};
