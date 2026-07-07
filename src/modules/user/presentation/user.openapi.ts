import { protectedOperation, successResponse } from '../../../swagger/openapi-helpers.js';

export const userOpenApiPaths = {
  '/api/v1/users/me': {
    get: protectedOperation({
      tags: ['Users'],
      summary: 'View current user',
      description: 'Returns the authenticated user profile for the current company context.',
      responses: {
        ...successResponse('CurrentUser', 'Current user profile'),
      },
    }),
  },
};
