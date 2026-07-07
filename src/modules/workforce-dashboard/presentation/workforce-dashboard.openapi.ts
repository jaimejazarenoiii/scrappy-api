import { protectedOperation, successResponse } from '../../../swagger/openapi-helpers.js';

export const workforceDashboardOpenApiPaths = {
  '/api/v1/workforce/dashboard': {
    get: protectedOperation({
      tags: ['Dashboard'],
      summary: 'Employee operational dashboard',
      responses: {
        ...successResponse('WorkforceDashboard', 'Workforce dashboard payload'),
      },
    }),
  },
};
